'use client'

import { FC, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import NavItem from './NavItem'
import { Home, Bot, TrendingUp, Settings, LogOut, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { Conversation } from '@/lib/types'
import Image from 'next/image'
import { deleteConversation } from '@/lib/api'

interface SidebarProps {
    onNavigate?: () => void
    conversations: Conversation[]
    loading: boolean
    onConversationDeleted?: (conversationId: string) => void  // Добавили callback
}

const Sidebar: FC<SidebarProps> = ({ onNavigate, conversations, loading, onConversationDeleted }) => {
    const pathname = usePathname()
    const { user, logout } = useAuth()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

        if (diffInHours < 1) return 'Just now'
        if (diffInHours < 24) return `${diffInHours}h ago`
        if (diffInHours < 48) return 'Yesterday'
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
        e.preventDefault()
        e.stopPropagation()

        if (!confirm('Are you sure you want to delete this conversation?')) {
            return
        }

        setDeletingId(conversationId)

        try {
            await deleteConversation(conversationId)
            onConversationDeleted?.(conversationId)
        } catch (error) {
            console.error('Failed to delete conversation:', error)
            alert('Failed to delete conversation')
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <aside className="w-64 h-full bg-zinc-950 border-r border-zinc-800 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <Image
                        src="/images/logo.svg"
                        alt="Educelo Logo"
                        width={48}
                        height={48}
                        className="w-12 h-12"
                    />
                    <div>
                        <h1 className="text-xl font-bold">educelo</h1>
                        <span className="text-xs text-purple-400 font-semibold">BETA</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-2 border-b border-zinc-800">
                <NavItem
                    href="/dashboard"
                    icon={<Home size={20} />}
                    label="Dashboard"
                    active={pathname === '/dashboard'}
                    onClick={onNavigate}
                />
                <NavItem
                    href="/dashboard/ai-tutor"
                    icon={<Bot size={20} />}
                    label="AI Tutor"
                    active={pathname === '/dashboard/ai-tutor'}
                    onClick={onNavigate}
                />
                <NavItem
                    href="/dashboard/progress"
                    icon={<TrendingUp size={20} />}
                    label="Progress"
                    active={pathname === '/dashboard/progress'}
                    onClick={onNavigate}
                />
                <NavItem
                    href="/dashboard/settings"
                    icon={<Settings size={20} />}
                    label="Settings"
                    active={pathname === '/dashboard/settings'}
                    onClick={onNavigate}
                />
            </nav>

            {/* Recent Conversations */}
            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                        <MessageSquare size={16} />
                        Recent Chats
                    </h3>
                    <Link
                        href="/dashboard/ai-tutor"
                        onClick={onNavigate}
                        className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors"
                    >
                        <Plus size={16} className="text-gray-400" />
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-zinc-900 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-gray-500 mb-2">No conversations yet</p>
                        <Link
                            href="/dashboard/ai-tutor"
                            onClick={onNavigate}
                            className="text-sm text-purple-400 hover:text-purple-300"
                        >
                            Start your first chat →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {conversations.slice(0, 10).map((conv) => (
                            <div key={conv.conversation_id} className="group relative">
                                <Link
                                    href={`/dashboard/ai-tutor?id=${conv.conversation_id}`}
                                    onClick={onNavigate}
                                    className="block p-3 pr-10 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer"
                                >
                                    <p className="text-sm font-medium line-clamp-2 group-hover:text-purple-400 transition-colors">
                                        {conv.title}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatTime(conv.updated_at)}
                                    </p>
                                </Link>

                                {/* Delete Button */}
                                <button
                                    onClick={(e) => handleDelete(e, conv.conversation_id)}
                                    disabled={deletingId === conv.conversation_id}
                                    className="absolute top-3 right-3 p-1.5 rounded-md opacity-0 cursor-pointer group-hover:opacity-100 hover:bg-red-600/20 text-gray-400 hover:text-red-400 transition-all disabled:opacity-50"
                                    title="Delete conversation"
                                >
                                    {deletingId === conv.conversation_id ? (
                                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 size={16} />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {conversations.length > 10 && (
                    <button className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                        View all ({conversations.length}) →
                    </button>
                )}
            </div>

            {/* Logout Button */}
            <div className="p-4 border-t border-zinc-800">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-zinc-800 hover:text-white cursor-pointer transition-all"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    )
}

export default Sidebar
