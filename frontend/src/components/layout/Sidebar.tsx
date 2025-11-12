'use client'

import { FC } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import NavItem from './NavItem'

interface SidebarProps {
    onNavigate?: () => void
}

const Sidebar: FC<SidebarProps> = ({ onNavigate }) => {
    const pathname = usePathname()
    const { user, logout } = useAuth()

    return (
        <aside className="w-64 h-full bg-zinc-950 border-r border-zinc-800 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <img src="/images/logo.svg" alt="Educelo" className="w-12 h-12" />
                    <div>
                        <h1 className="text-xl font-bold">educelo</h1>
                        <span className="text-xs text-purple-400 font-semibold">BETA</span>
                    </div>
                </div>
                {/* Показываем имя пользователя */}
                {user && (
                    <p className="text-sm text-gray-400 mt-3">Welcome, {user.username}!</p>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                <NavItem
                    href="/dashboard"
                    icon="🏠"
                    label="Dashboard"
                    active={pathname === '/dashboard'}
                    onClick={onNavigate}
                />
                <NavItem
                    href="/dashboard/ai-tutor"
                    icon="🤖"
                    label="AI Tutor"
                    active={pathname === '/dashboard/ai-tutor'}
                    onClick={onNavigate}
                />
                <NavItem
                    href="/dashboard/progress"
                    icon="📊"
                    label="Progress"
                    active={pathname === '/dashboard/progress'}
                    onClick={onNavigate}
                />
                <NavItem
                    href="/dashboard/settings"
                    icon="⚙️"
                    label="Settings"
                    active={pathname === '/dashboard/settings'}
                    onClick={onNavigate}
                />
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-zinc-800">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-zinc-800 hover:text-white cursor-pointer transition-all"
                >
                    <span className="text-xl">🚪</span>
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    )
}

export default Sidebar
