import os
from openai import AsyncOpenAI
from typing import List, Dict, AsyncIterator

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def generate_ai_response(messages: List[Dict[str, str]]) -> str:
    """
    Генерирует ответ от AI на основе истории сообщений (без streaming)
    """
    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful AI tutor specializing in education. Provide clear, encouraging, and detailed explanations to help students learn effectively."},
                *messages
            ],
            temperature=0.7,
            max_tokens=500
        )

        return response.choices[0].message.content

    except Exception as e:
        raise Exception(f"OpenAI API error: {str(e)}")


async def generate_ai_response_stream(messages: List[Dict[str, str]]) -> AsyncIterator[str]:
    """
    Генерирует ответ от AI с потоковой передачей (streaming)
    """
    try:
        stream = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful AI tutor specializing in education. Provide clear, encouraging, and detailed explanations to help students learn effectively."},
                *messages
            ],
            temperature=0.7,
            max_tokens=500,
            stream=True  # Включаем streaming
        )

        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    except Exception as e:
        raise Exception(f"OpenAI API error: {str(e)}")

async def generate_conversation_title(first_message: str) -> str:
    """
    Генерирует короткое название для разговора на основе первого сообщения

    Args:
        first_message: Первое сообщение пользователя

    Returns:
        str: Короткое название разговора (макс 50 символов)
    """
    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a title generator. Generate a short, concise, and descriptive title (maximum 50 characters) for a conversation based on the user's first message. The title should capture the main topic or question. Return ONLY the title, nothing else. No quotes, no punctuation at the end."
                },
                {
                    "role": "user",
                    "content": first_message
                }
            ],
            temperature=0.5,
            max_tokens=20
        )

        title = response.choices[0].message.content.strip()

        # Убираем кавычки если AI их добавил
        title = title.strip('"').strip("'")

        # Ограничиваем длину
        if len(title) > 50:
            title = title[:47] + "..."

        return title

    except Exception as e:
        # Fallback: используем первые 50 символов сообщения
        fallback_title = first_message[:50]
        if len(first_message) > 50:
            fallback_title += "..."
        return fallback_title
