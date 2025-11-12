'use client'
import { useState } from 'react'
import AuthToggle from '@/components/forms/AuthToggle'
import AuthForm from '@/components/ui/AuthForm'

export default function Page() {
    const [isLogin, setIsLogin] = useState(true)

    return (
        <section className="login-page min-h-screen flex items-center justify-center">
            <div className="window w-1/3 rounded-lg">
                <div className="mx-12 my-6 text-center flex flex-col items-center">
                    <div className="">
                        <img src="/images/logo.svg" alt="logo" className="h-16 w-16" />
                    </div>
                    <h3 className="text-2xl font-bold mt-4">Educelo</h3>
                    <p className="text-xs text-zinc-500 mt-2">Unlock your potential with AI</p>
                </div>
                <AuthToggle isLogin={isLogin} onChange={setIsLogin} />
                <div className="px-10">
                    <AuthForm isLogin={isLogin}/>
                </div>
                <div className="mt-6 text-center pb-6">
                    <p className="text-xs text-zinc-400">
                        Already have an account?
                        <a href="" className="text-pink-300"> Login</a>
                    </p>
                </div>
            </div>
        </section>
    )
}