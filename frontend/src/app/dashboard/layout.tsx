'use client'

import { ReactNode, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import ProtectedRoute from "@/app/auth/ProtectedRoute";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-black text-white overflow-hidden">
                {/* Mobile Menu Button */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-800"
                >
                    {sidebarOpen ? '✕' : '☰'}
                </button>

                {/* Overlay for mobile */}
                {sidebarOpen && (
                    <div
                        className="lg:hidden fixed inset-0 bg-black/50 z-30"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <div className={`
                fixed lg:static inset-y-0 left-0 z-40
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                    <Sidebar onNavigate={() => setSidebarOpen(false)} />
                </div>

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    )
}
