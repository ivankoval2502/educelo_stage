import {LoginData, RegisterData, User, AuthResponse, Conversation, ConversationCreate, ConversationWithMessages, MessageCreate} from "@/lib/types";
import {error} from "next/dist/build/output/log";
import {Message} from "postcss";

const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function registerUser(data: RegisterData): Promise<User> {
    const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Registration failed')
    }

    return response.json()
}

export async function loginUser(data: LoginData): Promise<AuthResponse> {
    const formData = new URLSearchParams()
    formData.append('username', data.email)
    formData.append('password', data.password)

    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Login failed')
    }

    return response.json()
}

export async function getCurrentUser(): Promise<User> {
    const token = localStorage.getItem('access_token')

    if (!token) {
        throw new Error ('No access token found')
    }

    const response = await fetch(`${API_URL}/api/v1/auth/me`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to get user')
    }

    return response.json()
}

// CHAT API

export async function createConversation(data: ConversationCreate): Promise<Conversation> {
    const token = localStorage.getItem('access_token')

    if (!token) {
        throw new Error('No access token found')
    }

    const response = await fetch(`${API_URL}/api/v1/chat/conversations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to create conversation')
    }

    return response.json()
}

// Получить список разговоров
export async function getConversations(): Promise<Conversation[]> {
    const token = localStorage.getItem('access_token')

    if (!token) {
        throw new Error('No access token found')
    }

    const response = await fetch(`${API_URL}/api/v1/chat/conversations`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to get conversations')
    }

    return response.json()
}

// Получить конкретный разговор с сообщениями
export async function getConversation(conversationId: string): Promise<ConversationWithMessages> {
    const token = localStorage.getItem('access_token')

    if (!token) {
        throw new Error('No access token found')
    }

    const response = await fetch(`${API_URL}/api/v1/chat/conversations/${conversationId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to get conversation')
    }

    return response.json()
}

// Отправить сообщение
export async function sendMessage(
    conversationId: string,
    data: MessageCreate
): Promise<Message> {
    const token = localStorage.getItem('access_token')

    if (!token) {
        throw new Error('No access token found')
    }

    const response = await fetch(
        `${API_URL}/api/v1/chat/conversations/${conversationId}/messages`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        }
    )

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to send message')
    }

    return response.json() as Promise<Message>
}

export async function sendMessageStream(
    conversationId: string,
    data: MessageCreate,
    onChunk: (chunk: string) => void,
    onComplete: (messageId: string) => void,
    onError: (error: string) => void,
    signal?: AbortSignal
): Promise<void> {
    const token = localStorage.getItem('access_token')

    if (!token) {
        throw new Error('No access token found')
    }

    try {
        const response = await fetch(
            `${API_URL}/api/v1/chat/conversations/${conversationId}/messages/stream`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
                signal,
            }
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'Failed to send message')
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
            throw new Error('No reader available')
        }

        let messageId = ''

        while (true) {
            const { done, value } = await reader.read()

            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6)

                    if (data === '[DONE]') {
                        onComplete(messageId)
                        return
                    }

                    try {
                        const parsed = JSON.parse(data)

                        if (parsed.message_id) {
                            messageId = parsed.message_id
                        }

                        if (parsed.content) {
                            onChunk(parsed.content)
                        }
                    } catch (e) {
                        console.error('Failed to parse SSE data:', e)
                    }
                }
            }
        }
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.log('Generation stopped by user')
            throw error  // ✅ ИЗМЕНИТЬ: Выбрасываем дальше вместо return
        }
        onError(error.message)
        throw error
    }
}


export async function generateConversationTitle(
    conversationId: string
): Promise<Conversation> {
    const token = localStorage.getItem('access_token')

    if (!token) {
        throw new Error('No access token found')
    }

    const response = await fetch(
        `${API_URL}/api/v1/chat/conversations/${conversationId}/generate-title`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        }
    )

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to generate title')
    }

    return response.json()
}

// Delete conversation
export async function deleteConversation(conversationId: string): Promise<void> {
    const token = localStorage.getItem('access_token')

    if (!token) {
        throw new Error('No access token found')
    }

    const response = await fetch(
        `${API_URL}/api/v1/chat/conversations/${conversationId}`,
        {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        }
    )

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to delete conversation')
    }
}

// Delete message
export async function deleteMessage(
    conversationId: string,
    messageId: string
): Promise<void> {
    const token = localStorage.getItem('access_token')

    if (!token) {
        throw new Error('No access token found')
    }

    const response = await fetch(
        `${API_URL}/api/v1/chat/conversations/${conversationId}/messages/${messageId}`,
        {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        }
    )

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to delete message')
    }
}