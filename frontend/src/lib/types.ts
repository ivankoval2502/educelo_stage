// Auth
export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    username: string;
    password: string;
    email: string;
}

export interface User {
    user_id: string;
    username: string;
    email: string;
    is_acitve: boolean;
    created_at: string;
}

export interface AuthResponse {
    access_token: string;
    token: string;
}

export interface ErrorResponse {
    detail: string;
}

// Chat

export interface Message {
    message_id: string
    role: 'user' | 'assistant'
    content: string
    created_at: string
}

export interface Conversation {
    conversation_id: string
    title: string
    created_at: string
    updated_at: string
}

export interface ConversationWithMessages extends Conversation {
    messages: Message[]
}

export interface MessageCreate {
    content: string
}

export interface ConversationCreate {
    title: string
}