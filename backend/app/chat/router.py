from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.conversation import Conversation, Message
from app.chat.schemas import (
    MessageCreate, MessageResponse,
    ConversationCreate, ConversationResponse,
    ConversationWithMessages,
    ConversationUpdate
)
from datetime import datetime, timezone
from app.chat.service import generate_ai_response, generate_ai_response_stream, generate_conversation_title
import json

router = APIRouter()

@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
        conversation: ConversationCreate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):

    new_conversation = Conversation(
        user_id=current_user.user_id,
        title=conversation.title
    )

    db.add(new_conversation)
    await db.commit()
    await db.refresh(new_conversation)

    return new_conversation

@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Получить все разговоры пользователя"""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.user_id)
        .order_by(Conversation.updated_at.desc())
    )
    conversations = result.scalars().all()
    return conversations

@router.get("/conversations/{conversation_id}", response_model=ConversationWithMessages)
async def get_conversation(
        conversation_id: UUID,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):

    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.conversation_id == conversation_id,
            Conversation.user_id == current_user.user_id
        )
    )
    conversation = result.scalars().first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    return conversation

@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
        conversation_id: str,
        message: MessageCreate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):

    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.conversation_id == conversation_id,
            Conversation.user_id == current_user.user_id
        )
    )

    conversation = result.scalars().first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    user_message = Message(
        conversation_id=conversation_id,
        role= "user",
        content=message.content
    )

    db.add(user_message)
    await db.commit()

    messages_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )

    all_messages = messages_result.scalars().all()

    message_history = [
        {"role": msg.role, "content": msg.content}
        for msg in all_messages
    ]

    try:
        ai_response = await generate_ai_response(message_history)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating AI response: {str(e)}"
        )

    assistant_message = Message(
        conversation_id=conversation_id,
        role= "assistant",
        content=ai_response
    )
    db.add(assistant_message)

    from datetime import datetime, timezone
    conversation.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(assistant_message)

    return assistant_message

@router.post("/conversations/{conversation_id}/messages/stream")
async def send_message_stream(
        conversation_id: UUID,
        message: MessageCreate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Отправить сообщение и получить ответ от AI в режиме streaming"""

    # Проверяем существование разговора
    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.conversation_id == conversation_id,
            Conversation.user_id == current_user.user_id
        )
    )
    conversation = result.scalars().first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # Сохраняем сообщение пользователя
    user_message = Message(
        conversation_id=conversation_id,
        role="user",
        content=message.content
    )
    db.add(user_message)
    await db.commit()
    await db.refresh(user_message)

    # Получаем историю сообщений для контекста
    messages_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    all_messages = messages_result.scalars().all()

    # Формируем историю для OpenAI
    message_history = [
        {"role": msg.role, "content": msg.content}
        for msg in all_messages
    ]

    # Создаём запись для ответа AI
    assistant_message = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=""  # Будем накапливать контент
    )
    db.add(assistant_message)
    await db.commit()
    await db.refresh(assistant_message)

    # Streaming функция
    async def stream_response():
        full_content = ""

        try:
            # Сначала отправляем ID сообщения
            yield f"data: {json.dumps({'message_id': str(assistant_message.message_id), 'type': 'start'})}\n\n"

            # Затем стримим контент
            async for chunk in generate_ai_response_stream(message_history):
                full_content += chunk
                yield f"data: {json.dumps({'content': chunk, 'type': 'chunk'})}\n\n"

            # Сохраняем полный ответ в БД
            assistant_message.content = full_content
            conversation.updated_at = datetime.now(timezone.utc)
            await db.commit()

            # Отправляем финальное сообщение
            yield f"data: [DONE]\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e), 'type': 'error'})}\n\n"

    return StreamingResponse(
        stream_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

@router.post("/conversations/{conversation_id}/generate-title", response_model=ConversationResponse)
async def generate_title(
        conversation_id: UUID,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Генерирует AI название для разговора на основе первого сообщения"""

    # Получаем разговор
    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.conversation_id == conversation_id,
            Conversation.user_id == current_user.user_id
        )
    )
    conversation = result.scalars().first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # Получаем первое сообщение пользователя
    messages_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id, Message.role == "user")
        .order_by(Message.created_at)
        .limit(1)
    )
    first_message = messages_result.scalars().first()

    if not first_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No user messages found"
        )

    # Генерируем название через AI
    try:
        new_title = await generate_conversation_title(first_message.content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate title: {str(e)}"
        )

    # Обновляем название
    conversation.title = new_title
    conversation.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(conversation)

    return conversation

# Обновите эндпоинт PATCH
@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
        conversation_id: UUID,
        conversation_update: ConversationUpdate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Обновить название разговора"""
    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.conversation_id == conversation_id,
            Conversation.user_id == current_user.user_id
        )
    )
    conversation = result.scalars().first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # Обновляем название
    conversation.title = conversation_update.title
    conversation.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(conversation)

    return conversation

@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
        conversation_id: UUID,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Удалить разговор"""
    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.conversation_id == conversation_id,
            Conversation.user_id == current_user.user_id
        )
    )
    conversation = result.scalars().first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    await db.delete(conversation)
    await db.commit()

    return None

@router.delete("/conversations/{conversation_id}/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
        conversation_id: UUID,
        message_id: UUID,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Удалить сообщение"""
    # Проверяем, что conversation принадлежит пользователю
    conv_result = await db.execute(
        select(Conversation)
        .where(
            Conversation.conversation_id == conversation_id,
            Conversation.user_id == current_user.user_id
        )
    )
    conversation = conv_result.scalars().first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # Находим и удаляем сообщение
    msg_result = await db.execute(
        select(Message)
        .where(
            Message.message_id == message_id,
            Message.conversation_id == conversation_id
        )
    )
    message = msg_result.scalars().first()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )

    await db.delete(message)
    await db.commit()

    return None
