'use client'

import { FC, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Check, Copy } from 'lucide-react'

interface CodeBlockProps {
    language: string
    code: string
}

const CodeBlock: FC<CodeBlockProps> = ({ language, code }) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Определяем язык для отображения
    const displayLanguage = language || 'text'

    return (
        <div className="relative group my-4">
            {/* Header с языком и кнопкой копирования */}
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700 rounded-t-lg">
        <span className="text-xs font-mono text-gray-400 uppercase">
          {displayLanguage}
        </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-white bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
                >
                    {copied ? (
                        <>
                            <Check size={14} />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy size={14} />
                            Copy
                        </>
                    )}
                </button>
            </div>

            {/* Code block с подсветкой синтаксиса */}
            <SyntaxHighlighter
                language={displayLanguage}
                style={vscDarkPlus}
                customStyle={{
                    margin: 0,
                    borderRadius: '0 0 0.5rem 0.5rem',
                    fontSize: '0.875rem',
                    padding: '1rem',
                }}
                showLineNumbers={false}
                wrapLines={true}
                wrapLongLines={true}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    )
}

export default CodeBlock
