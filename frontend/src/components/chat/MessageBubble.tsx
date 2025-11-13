import { FC, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Components } from 'react-markdown'
import CodeBlock from './CodeBlock'
import { Trash2 } from 'lucide-react'

interface MessageBubbleProps {
    role: 'user' | 'assistant'
    content: string
    isNew?: boolean
    messageId?: string
    conversationId?: string
    onDelete?: (messageId: string) => void
}

const MessageBubble: FC<MessageBubbleProps> = ({
                                                   role,
                                                   content,
                                                   isNew = false,
                                                   messageId,
                                                   conversationId,
                                                   onDelete
                                               }) => {
    const isUser = role === 'user'
    const [displayedContent, setDisplayedContent] = useState(content)
    const [isHovered, setIsHovered] = useState(false)

    useEffect(() => {
        setDisplayedContent(content)
    }, [content])

    const handleDelete = () => {
        if (messageId && onDelete) {
            if (confirm('Delete this message?')) {
                onDelete(messageId)
            }
        }
    }

    const components: Components = {
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,

        strong: ({ children }) => (
            <strong className="font-bold text-white">{children}</strong>
        ),

        em: ({ children }) => <em className="italic">{children}</em>,

        code: ({ children, className }) => {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            const isInline = !className

            if (isInline) {
                return (
                    <code className="bg-zinc-700 px-1.5 py-0.5 rounded text-sm font-mono text-purple-300">
                        {children}
                    </code>
                )
            }

            return (
                <CodeBlock
                    language={language}
                    code={String(children).replace(/\n$/, '')}
                />
            )
        },

        pre: ({ children }) => <>{children}</>,

        ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
        ),

        ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
        ),

        li: ({ children }) => <li className="mb-1">{children}</li>,

        h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-2 text-white">{children}</h1>
        ),

        h2: ({ children }) => (
            <h2 className="text-xl font-bold mb-2 text-white">{children}</h2>
        ),

        h3: ({ children }) => (
            <h3 className="text-lg font-bold mb-2 text-white">{children}</h3>
        ),

        blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-300 my-2">
                {children}
            </blockquote>
        ),

        a: ({ children, href }) => (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
            >
                {children}
            </a>
        ),
    }

    return (
        <div
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
        >
            <div className="relative max-w-3xl">
                <div
                    className={`p-4 rounded-lg ${
                        isUser
                            ? 'bg-purple-600 text-white'
                            : 'bg-zinc-800 text-gray-100'
                    }`}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Кнопка удаления - ВНУТРИ сообщения */}
                    {messageId && onDelete && isHovered && (
                        <button
                            onClick={handleDelete}
                            className="absolute top-2 right-2 p-1 rounded-md bg-zinc-900/80 cursor-pointer hover:bg-red-600/80 text-gray-400 hover:text-white transition-all"
                            title="Delete message"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}

                    {isUser ? (
                        <p className="whitespace-pre-wrap">{displayedContent}</p>
                    ) : (
                        <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown components={components}>
                                {displayedContent}
                            </ReactMarkdown>
                            {isNew && (
                                <span className="inline-block w-1 h-4 bg-purple-500 animate-pulse ml-0.5" />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default MessageBubble
