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