'use client'

import { useState } from 'react'
import FeatureCard from '@/components/dashboard/FeatureCard'

export default function DashboardPage() {
    const [rightSidebarOpen, setRightSidebarOpen] = useState(false)

    return (
        <div className="flex flex-col lg:flex-row h-full">
            {/* Main Content Area */}
            <div className="flex-1 p-4 md:p-8 overflow-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold">Welcome, user!</h1>
                    <p className="text-gray-400 mt-2">Ready to accelerate your learning journey?</p>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                    <FeatureCard
                        title="Try our AI Tutor"
                        description="Get personalized guidance and instant answers to your questions"
                        icon="🤖"
                        href="/dashboard/ai-tutor"
                        iconBg="bg-gradient-to-br from-purple-600 to-purple-800"
                    />
                    <FeatureCard
                        title="Personalized Plan Generator"
                        description="Create custom learning paths tailored to your goals"
                        icon="📋"
                        href="/dashboard/plan-generator"
                        iconBg="bg-gradient-to-br from-cyan-600 to-blue-700"
                    />
                    <FeatureCard
                        title="Learning Insights"
                        description="Track your progress with detailed analytics and reports"
                        icon="📊"
                        href="/dashboard/insights"
                        iconBg="bg-gradient-to-br from-purple-600 to-pink-600"
                    />
                </div>

                {/* Chat Input Section */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-xl">
                            🤖
                        </div>
                        <h2 className="text-base md:text-lg font-semibold">Ask me anything about your learning goal</h2>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            placeholder="Type your question here..."
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                        />
                        <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                            <span>✉️</span>
                            Send
                        </button>
                    </div>
                </div>

                {/* Mobile History Toggle Button */}
                <button
                    onClick={() => setRightSidebarOpen(true)}
                    className="lg:hidden fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-full shadow-lg flex items-center justify-center z-20"
                >
                    💬
                </button>
            </div>

            {/* Right Sidebar - Desktop */}
            <aside className="hidden lg:block w-80 bg-zinc-900 border-l border-zinc-800 p-6 overflow-auto">
                <RightSidebarContent />
            </aside>

            {/* Right Sidebar - Mobile (Drawer) */}
            {rightSidebarOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="lg:hidden fixed inset-0 bg-black/50 z-40"
                        onClick={() => setRightSidebarOpen(false)}
                    />

                    {/* Drawer */}
                    <aside className="lg:hidden fixed right-0 top-0 bottom-0 w-80 bg-zinc-900 border-l border-zinc-800 p-6 overflow-auto z-50 transform transition-transform duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">Recent Conversations</h2>
                            <button
                                onClick={() => setRightSidebarOpen(false)}
                                className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>
                        <RightSidebarContent />
                    </aside>
                </>
            )}
        </div>
    )
}

// Выносим содержимое правого сайдбара в отдельный компонент
function RightSidebarContent() {
    return (
        <>
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-1">Recent Conversations</h2>
                <p className="text-sm text-gray-400">Your learning journey history</p>
            </div>

            {/* Conversation Items */}
            <div className="space-y-4">
                {[
                    { title: 'How can I improve my Python skills?', time: '3 hours ago', icon: '👤' },
                    { title: 'I recommend starting with data structures and algorithms.', time: '5 hours ago', icon: '🤖' },
                    { title: 'Create a study plan for machine learning', time: 'Yesterday', icon: '👤' },
                    { title: "Here's a comprehensive 12-week ML roadmap.", time: 'Yesterday', icon: '🤖' },
                ].map((conv, idx) => (
                    <div key={idx} className="bg-zinc-800 rounded-lg p-4 hover:bg-zinc-750 transition-colors cursor-pointer">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-sm flex-shrink-0">
                                {conv.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-2">{conv.title}</p>
                                <p className="text-xs text-gray-400 mt-1">{conv.time}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* View All History Button */}
            <button className="w-full mt-6 py-3 border border-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2">
                <span>🔄</span>
                View All History
            </button>
        </>
    )
}
