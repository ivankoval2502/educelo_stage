'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/api'
import { User } from '@/lib/types'

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (token: string) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const token = localStorage.getItem('access_token')

        if (!token) {
            setLoading(false)
            return
        }

        try {
            const userData = await getCurrentUser()
            setUser(userData)
        } catch (error) {
            console.error('Auth check failed:', error)
            localStorage.removeItem('access_token')
        } finally {
            setLoading(false)
        }
    }

    const login = async (token: string) => {
        localStorage.setItem('access_token', token)
        try {
            const userData = await getCurrentUser()
            setUser(userData)
            router.push('/dashboard')
        } catch (error) {
            console.error('Failed to get user:', error)
            localStorage.removeItem('access_token')
        }
    }

    const logout = () => {
        localStorage.removeItem('access_token')
        setUser(null)
        router.push('/auth')
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
