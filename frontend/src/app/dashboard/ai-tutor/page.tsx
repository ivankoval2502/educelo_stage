'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import { useSearchParams } from 'next/navigation'
import {
    getConversations,
    createConversation,
    getConversation,
    sendMessageStream,
    generateConversationTitle,
    deleteMessage
} from '@/lib/api'
import type {
    Conversation,
    ConversationWithMessages,
    Message as ChatMessage
} from '@/lib/types'
import MessageBubble from "@/components/chat/MessageBubble"
import { Bot, Code, Database, Calculator, Sparkles, Square } from "lucide-react"
import {showError, showSuccess} from "@/lib/toast";

export default function AITutorPage() {
    const { user } = useAuth()
    const searchParams = useSearchParams()
    const conversationId = searchParams.get('id')

    const [conversations, setConversations] = useState<Conversation[]>([])
    const [currentConversation, setCurrentConversation] = useState<ConversationWithMessages | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [inputMessage, setInputMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set())

    // ID of the AI message currently being generated
    const [currentAiMessageId, setCurrentAiMessageId] = useState<string | null>(null)
    // Ref for autoscrolling to bottom of messages
    const messagesEndRef = useRef<HTMLDivElement>(null)
    // Reff for aborting ongoing requests
    const abortControllerRef = useRef<AbortController | null>(null)

    useEffect(() => {
        loadConversations()

        if (conversationId) {
            loadConversation(conversationId)
        }
    }, [conversationId])

    // Автопрокрутка при новых сообщениях
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const loadConversations = async () => {
        try {
            const data = await getConversations()
            setConversations(data)
        } catch (error) {
            console.error('Failed to load conversations:', error)
        }
    }

    const handleCreateConversation = async () => {
        try {
            setLoading(true)
            const newConv = await createConversation({
                title: `Chat ${new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
            })
            setConversations([newConv, ...conversations])
            await loadConversation(newConv.conversation_id)
        } catch (error) {
            console.error('Failed to create conversation:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadConversation = async (conversationId: string) => {
        try {
            setLoading(true)
            const data = await getConversation(conversationId)
            setCurrentConversation(data)
            setMessages(data.messages)
            setNewMessageIds(new Set())  // Сбрасываем флаги при загрузке
        } catch (error) {
            console.error('Failed to load conversation:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleStopGeneration = () => {
        if (abortControllerRef.current) {
            console.log('🛑 Stopping generation...')
            abortControllerRef.current.abort()
            abortControllerRef.current = null
            setSending(false)
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!inputMessage.trim() || !currentConversation || sending) return

        const userMessageContent = inputMessage
        const userMessage: ChatMessage = {
            message_id: 'temp-user-' + Date.now(),
            role: 'user',
            content: inputMessage,
            created_at: new Date().toISOString()
        }

        setMessages(prev => [...prev, userMessage])
        setInputMessage('')
        setSending(true)

        const tempAiMessage: ChatMessage = {
            message_id: 'temp-ai-' + Date.now(),
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString()
        }

        setMessages(prev => [...prev, tempAiMessage])
        setNewMessageIds(prev => new Set(prev).add(tempAiMessage.message_id))

        const isFirstMessage = messages.length === 0

        abortControllerRef.current = new AbortController()

        let messageIdForDeletion: string | null = null

        try {
            let accumulatedContent = ''

            await sendMessageStream(
                currentConversation.conversation_id,
                { content: userMessageContent },
                (chunk: string) => {
                    //console.log('📝 Chunk received:', chunk.substring(0, 20))
                    accumulatedContent += chunk
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.message_id === tempAiMessage.message_id
                                ? { ...msg, content: accumulatedContent }
                                : msg
                        )
                    )
                },
                async (messageId: string) => {
                    //console.log('✅ onComplete called with messageId:', messageId)
                    messageIdForDeletion = messageId
                    setCurrentAiMessageId(messageId)

                    setMessages(prev =>
                        prev.map(msg =>
                            msg.message_id === tempAiMessage.message_id
                                ? { ...msg, message_id: messageId }
                                : msg
                        )
                    )

                    // Обновляем Set с новым ID
                    setNewMessageIds(prev => {
                        const newSet = new Set(prev)
                        newSet.delete(tempAiMessage.message_id)
                        newSet.add(messageId)
                        return newSet
                    })

                    // Генерируем AI название после первого сообщения
                    if (isFirstMessage) {
                        console.log('🔄 Generating title for first message...')
                        try {
                            const updatedConversation = await generateConversationTitle(
                                currentConversation.conversation_id
                            )

                            console.log('✅ Title generated:', updatedConversation.title)

                            setCurrentConversation({
                                ...currentConversation,
                                title: updatedConversation.title
                            })

                            setConversations(prev =>
                                prev.map(conv =>
                                    conv.conversation_id === currentConversation.conversation_id
                                        ? { ...conv, title: updatedConversation.title }
                                        : conv
                                )
                            )
                        } catch (error) {
                            console.error('❌ Failed to generate title:', error)

                            const fallbackTitle = userMessageContent.slice(0, 50) +
                                (userMessageContent.length > 50 ? '...' : '')

                            console.log('🔄 Using fallback title:', fallbackTitle)

                            setCurrentConversation({
                                ...currentConversation,
                                title: fallbackTitle
                            })

                            setConversations(prev =>
                                prev.map(conv =>
                                    conv.conversation_id === currentConversation.conversation_id
                                        ? { ...conv, title: fallbackTitle }
                                        : conv
                                )
                            )
                        }
                    }

                    // ВАЖНО: Удаляем из newMessageIds после небольшой задержки
                    setTimeout(() => {
                        setNewMessageIds(prev => {
                            const newSet = new Set(prev)
                            newSet.delete(messageId)
                            return newSet
                        })
                    }, 500)
                },
                (error: string) => {
                    console.error('Streaming error:', error)
                    setMessages(prev => prev.filter(msg => msg.message_id !== tempAiMessage.message_id))
                    setNewMessageIds(prev => {
                        const newSet = new Set(prev)
                        newSet.delete(tempAiMessage.message_id)
                        return newSet
                    })
                },
                abortControllerRef.current.signal
            )
        } catch (error: any) {
            if (error.name === 'AbortError' || abortControllerRef.current === null) {
                console.log('🛑 Stop detected, cleaning up...')

                // Удаляем сообщение из UI
                setMessages(prev => prev.filter(msg =>
                    !msg.message_id.startsWith('temp-ai') &&
                    msg.message_id !== messageIdForDeletion
                ))

                // Удаляем из БД
                if (messageIdForDeletion && currentConversation) {
                    try {
                        console.log('🗑️ Deleting message:', messageIdForDeletion)
                        await deleteMessage(currentConversation.conversation_id, messageIdForDeletion)
                        console.log('✅ Message deleted from DB')
                    } catch (error) {
                        console.error('❌ Failed to delete message:', error)
                    }
                }
            } else {
                // Обычная ошибка (не abort)
                console.error('Failed to send message:', error)
                setMessages(prev => prev.filter(msg => msg.message_id !== tempAiMessage.message_id))
            }
        } finally {
            setSending(false)
            abortControllerRef.current = null
            setCurrentAiMessageId(null)
        }
    }

    const handleQuickPrompt = (prompt: string) => {
        setInputMessage(prompt)
    }

    const handleDeleteMessage = async (messageId: string) => {
        if (!currentConversation) return

        try {
            await deleteMessage(currentConversation.conversation_id, messageId)

            // Удаляем из UI
            setMessages(prev => prev.filter(msg => msg.message_id !== messageId))
            showSuccess("Message deleted")

            console.log('✅ Message deleted')
        } catch (error) {
            console.error('❌ Failed to delete message:', error)
            showError("Failed to delete message")
        }
    }

    return (
        <div className="flex flex-col h-full custom-scrollbar bg-gradient-to-b from-black via-zinc-950 to-black">
            {!currentConversation ? (
                // Welcome Screen
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="max-w-2xl w-full text-center">
                        <div className="mb-6 flex justify-center">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-purple-500/50">
                                <Bot size={48} className="text-white" />
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
                            Welcome to AI Tutor!
                        </h1>

                        <p className="text-gray-400 text-lg mb-12">
                            I&apos;m here to help you learn and understand any programming topic. Ask me anything!
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <QuickStartCard
                                icon={<Code size={24} />}
                                title="Learn Python"
                                description="Master Python fundamentals and advanced concepts"
                                onClick={() => {
                                    handleCreateConversation()
                                    handleQuickPrompt("I want to learn Python. Where should I start?")
                                }}
                            />
                            <QuickStartCard
                                icon={<Database size={24} />}
                                title="Database Design"
                                description="Learn SQL, PostgreSQL, and database optimization"
                                onClick={() => {
                                    handleCreateConversation()
                                    handleQuickPrompt("Can you teach me database design best practices?")
                                }}
                            />
                            <QuickStartCard
                                icon={<Calculator size={24} />}
                                title="Algorithms"
                                description="Understand data structures and algorithms"
                                onClick={() => {
                                    handleCreateConversation()
                                    handleQuickPrompt("Explain common sorting algorithms with examples")
                                }}
                            />
                            <QuickStartCard
                                icon={<Sparkles size={24} />}
                                title="Web Development"
                                description="Build modern web apps with React and Next.js"
                                onClick={() => {
                                    handleCreateConversation()
                                    handleQuickPrompt("How do I build a web app with React and Next.js?")
                                }}
                            />
                        </div>

                        <button
                            onClick={handleCreateConversation}
                            disabled={loading}
                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 cursor-pointer font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Starting...' : 'Start New Conversation'}
                        </button>
                        <p className="text-xs mt-4 text-zinc-400">or choose from already existing conversations</p>
                    </div>
                </div>
            ) : (
                // Chat Interface
                <>
                    {/* Messages */}
                    <div className="flex-1 overflow-auto p-6 pb-32 custom-scrollbar">
                        <div className="space-y-4">
                            {messages.map((message, index) => (
                                <div
                                    key={message.message_id}
                                    className={message.role === 'user' ? 'animate-fadeIn' : ''}
                                    style={message.role === 'user' ? {
                                        animationDelay: `${index * 0.05}s`,
                                        animationFillMode: 'backwards'
                                    } : {}}
                                >
                                    <MessageBubble
                                        role={message.role}
                                        content={message.content}
                                        isNew={newMessageIds.has(message.message_id)}
                                        messageId={message.message_id}
                                        conversationId={currentConversation?.conversation_id}
                                        onDelete={handleDeleteMessage}
                                    />
                                </div>
                            ))}
                            {sending && (
                                <div className="flex justify-start animate-fadeIn">
                                    <div className="max-w-2xl p-4 rounded-lg bg-zinc-800 text-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                            </div>
                                            <span className="text-sm">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Input - Fixed to bottom */}
                    <div className="fixed bottom-0 left-0 lg:left-64 right-0 border-t border-zinc-800 bg-black/95 backdrop-blur-sm p-4 md:p-6">
                    <form onSubmit={handleSendMessage} className="w-full mx-auto">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder="Type your question here..."
                                    disabled={sending}
                                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all disabled:opacity-50"
                                />
                                {sending ? (
                                    // Кнопка Stop
                                    <button
                                        type="button"
                                        onClick={handleStopGeneration}
                                        className="px-6 py-3 bg-red-800 hover:bg-red-950 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Square size={16} fill="currentColor" />
                                        Stop
                                    </button>
                                ) : (
                                    // Кнопка Send
                                    <button
                                        type="submit"
                                        disabled={!inputMessage.trim()}
                                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Send
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </>
            )}
        </div>
    )
}

// Quick Start Card Component
interface QuickStartCardProps {
    icon: React.ReactNode
    title: string
    description: string
    onClick: () => void
}

function QuickStartCard({ icon, title, description, onClick }: QuickStartCardProps) {
    return (
        <button
            onClick={onClick}
            className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-purple-600 hover:shadow-lg hover:shadow-purple-500/20 transition-all text-left group cursor-pointer"
        >
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600/20 to-cyan-600/20 flex items-center justify-center text-purple-400 group-hover:text-purple-300 transition-colors flex-shrink-0">
                    {icon}
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1 group-hover:text-purple-300 transition-colors">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-400">
                        {description}
                    </p>
                </div>
            </div>
        </button>
    )
}
