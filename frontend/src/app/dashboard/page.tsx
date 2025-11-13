'use client'

import { useState } from 'react'
import FeatureCard from '@/components/dashboard/FeatureCard'
import { useAuth } from "@/lib/context/AuthContext"
import { Bot, MapIcon, ChartBar, Send } from "lucide-react"

export default function DashboardPage() {
    const { user } = useAuth()

    if (!user) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">Loading...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Scrollable Content */}
                <div className="flex-1 overflow-auto p-4 md:p-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold">Welcome, {user.username}!</h1>
                        <p className="text-gray-400 mt-2">Ready to accelerate your learning journey?</p>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        <FeatureCard
                            title="Try our AI Tutor"
                            description="Get personalized guidance and instant answers to your questions"
                            icon={<Bot/>}
                            href="/dashboard/ai-tutor"
                            iconBg="bg-gradient-to-br from-purple-600 to-purple-800"
                        />
                        <FeatureCard
                            title="Personalized Plan Generator"
                            description="Create custom learning paths tailored to your goals"
                            icon={<MapIcon/>}
                            href="/dashboard/plan-generator"
                            iconBg="bg-gradient-to-br from-cyan-600 to-blue-700"
                        />
                        <FeatureCard
                            title="Learning Insights"
                            description="Track your progress with detailed analytics and reports"
                            icon={<ChartBar/>}
                            href="/dashboard/insights"
                            iconBg="bg-gradient-to-br from-purple-600 to-pink-600"
                        />
                    </div>
                </div>

                {/* Chat Input Section - Прижат к низу */}
                <div className="border-t border-zinc-800 p-4 md:p-6 bg-black">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
                                <Bot size={20}/>
                            </div>
                            <h2 className="text-base md:text-lg font-semibold">Ask me anything about your learning goal</h2>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                placeholder="Type your question here..."
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                            />
                            <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer">
                                <Send size={16}/>
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
