import {LoginData, RegisterData, User, AuthResponse} from "@/lib/types";

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