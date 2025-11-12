'use client'

import { FC, FormEvent, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { loginUser, registerUser } from "@/lib/api";
import { LoginData, RegisterData } from "@/lib/types";
import { useAuth } from "@/lib/context/AuthContext";

interface AuthFormProps {
    isLogin: boolean;
}

const AuthForm: FC<AuthFormProps> = ({ isLogin }) => {
    const { login } = useAuth() // Используем context
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setErrors({})
        setLoading(true)
        setSuccess(false)

        try {
            if (isLogin) {
                // Логин
                const loginData: LoginData = {
                    email: formData.email,
                    password: formData.password,
                }
                const response = await loginUser(loginData)

                // Используем login из context - он сам редиректнет
                await login(response.access_token)
                setSuccess(true)
            } else {
                // Регистрация
                const registerData: RegisterData = {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                }
                await registerUser(registerData)
                setSuccess(true)

                // После регистрации предлагаем войти
                setTimeout(() => {
                    setSuccess(false)
                    // Можно автоматически переключить на логин
                }, 2000)
            }
        } catch (error: any) {
            setErrors({ general: error.message })
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))

        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mt-6">
            {/* Показываем ошибку */}
            {errors.general && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                    {errors.general}
                </div>
            )}

            {/* Показываем успех */}
            {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
                    {isLogin ? 'Login Successful! Redirecting...' : 'Registration Successful!'}
                </div>
            )}

            {/* Username/Full Name - только при регистрации */}
            {!isLogin && (
                <Input
                    label="Full Name"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    placeholder="Enter your full name"
                    required
                    error={errors.username}
                />
            )}

            {/* Email - всегда показываем */}
            <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter your email"
                required
                error={errors.email}
            />

            {/* Password - всегда показываем */}
            <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                required
                error={errors.password}
            />

            {/* Кнопка отправки */}
            <div className="mt-6">
                <Button isLogin={isLogin} type="submit" disabled={loading}/>
            </div>
        </form>
    )
}

export default AuthForm;