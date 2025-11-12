'use client'

import { FC } from 'react'

interface AuthToggleProps {
    isLogin: boolean
    onChange: (isLogin: boolean) => void
}

const AuthToggle: FC<AuthToggleProps> = ({ isLogin, onChange }) => {
    return (
        <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-xl bg-zinc-800 p-1 shadow-md">
                <button
                    type="button"
                    onClick={() => onChange(true)}
                    className={`px-8 py-2 text-sm font-semibold rounded-xl transition-all${
                        isLogin
                            ? 'bg-white bg-gradient-to-t from-purple-800 to-cyan-900 border-b-2'
                            : 'bg-transparent hover:text-gray-400 cursor-pointer'
                    }`}
                >
                    Login
                </button>
                <button
                    type="button"
                    onClick={() => onChange(false)}
                    className={`px-8 py-2 text-sm font-semibold rounded-xl transition-all ${
                        !isLogin
                            ? 'bg-white bg-gradient-to-t from-purple-800 to-cyan-900 border-b-2'
                            : 'bg-transparent hover:text-gray-400 cursor-pointer'
                    }`}
                >
                    Sign Up
                </button>
            </div>
        </div>
    )
}

export default AuthToggle
