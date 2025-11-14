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
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.log('Generation stopped by user')
            throw error
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        onError(errorMessage)
        throw error
    }
}

//Generate a new conversation title after the first message

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

// Update conversation title

export async function updateConversationTitle(
    conversationId: string,
    title: string
): Promise<Conversation> {
    const token = localStorage.getItem('access_token')

    if (!token) {
        throw new Error('No access token found')
    }

    const response = await fetch(
        `${API_URL}/api/v1/chat/conversations/${conversationId}`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({title}),
        }
    )

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to update conversation title')
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

//Progress API
export async function getProgressStats() {
    const response = await fetch(`${API_URL}/api/v1/progress/stats`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
    })

    if (!response.ok) {
        throw new Error('Failed to fetch progress stats')
    }

    return response.json()
}

export async function getProgressActivity() {
    const response = await fetch(`${API_URL}/api/v1/progress/activity`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
    })

    if (!response.ok) {
        throw new Error('Failed to fetch activity data')
    }

    return response.json()
}

// Update user's data

export async function updateUserProfile(data: {username?: string, email?: string}): Promise<{message: string; user: {username: string; email: string}}> {
    const token = localStorage.getItem('access_token')

    if (!token) {
        throw new Error('No access token found')
    }

    const response = await fetch(`${API_URL}/api/v1/auth/me`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to update profile')
    }

    return response.json()
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{message: string}> {
    const token = localStorage.getItem('access_token')
    if (!token) {
        throw new Error('No access token found')
    }

    const response = await fetch(`${API_URL}/api/v1/auth/change-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
        })
    }
    )

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to change password')
    }

    return response.json()
}

export async function updateWeeklyGoal(weeklyGoalHours: number): Promise<{message: string; weekly_goal_hours: number; next_update_available: string}> {
    const token = localStorage.getItem('access_token')

    if (!token) {
        throw new Error('No access token found')
    }

    const response = await fetch(`${API_URL}/api/v1/auth/goal`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({weekly_goal_hours: weeklyGoalHours})
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to update weekly goal')
    }

    return response.json()
}