'use client'

import { useState, useEffect } from 'react'
import { Clock, Target, Flame } from 'lucide-react'
import { getProgressStats, getProgressActivity } from '@/lib/api'

interface Stats {
    study_time: {
        hours: number
        change: string
    }
    weekly_goal: {
        current_hours: number
        goal_hours: number
        percent: number
    }
    day_streak: {
        days: number
        status: string
    }
}

interface Activity {
    date: string
    count: number
    level: 'none' | 'low' | 'medium' | 'high'
}

export default function ProgressPage() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [activity, setActivity] = useState<Activity[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [statsData, activityData] = await Promise.all([
                getProgressStats(),
                getProgressActivity()
            ])

            setStats(statsData)
            setActivity(activityData.activity)
        } catch (error) {
            console.error('Failed to load progress data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-400">Loading...</div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Study Time */}
                <StatsCard
                    icon={<Clock size={24} />}
                    title="Study Time"
                    value={`${stats?.study_time.hours || 0}h`}
                    subtitle={stats?.study_time.change || ''}
                    color="purple"
                />

                {/* Weekly Goal */}
                <StatsCard
                    icon={<Target size={24} />}
                    title="Weekly Goal"
                    value={`${stats?.weekly_goal.current_hours || 0}h / ${stats?.weekly_goal.goal_hours || 10}h`}
                    subtitle={`${stats?.weekly_goal.percent || 0}% complete`}
                    color="cyan"
                    progress={stats?.weekly_goal.percent || 0}
                />

                {/* Day Streak */}
                <StatsCard
                    icon={<Flame size={24} />}
                    title="Day Streak"
                    value={stats?.day_streak.days || 0}
                    subtitle={stats?.day_streak.status || ''}
                    color="orange"
                />
            </div>

            {/* Learning Roadmap */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
                <h2 className="text-xl font-semibold mb-6">Learning Roadmap</h2>

                <div className="space-y-4">
                    <RoadmapItem
                        title="Foundations of Machine Learning"
                        description="Master the fundamentals of ML algorithms, data preprocessing, and model evaluation"
                        progress={100}
                        status="completed"
                    />

                    <RoadmapItem
                        title="Deep Learning & Neural Networks"
                        description="Dive deep into neural networks, CNNs, RNNs, and modern architectures"
                        progress={65}
                        status="in-progress"
                    />

                    <RoadmapItem
                        title="Natural Language Processing"
                        description="Learn text processing, sentiment analysis, and transformer models"
                        progress={0}
                        status="planned"
                    />

                    <RoadmapItem
                        title="Computer Vision"
                        description="Master image processing, object detection, and advanced CV techniques"
                        progress={0}
                        status="planned"
                    />
                </div>
            </div>

            {/* Learning Activity Heatmap */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6">Learning Activity</h2>
                <div className="text-sm text-gray-400 mb-4">52 weeks of learning</div>

                <ActivityHeatmap activity={activity} />

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                    <span>No activity</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 bg-zinc-800 rounded"></div>
                        <div className="w-3 h-3 bg-cyan-900/40 rounded"></div>
                        <div className="w-3 h-3 bg-cyan-600/60 rounded"></div>
                        <div className="w-3 h-3 bg-cyan-500 rounded"></div>
                    </div>
                    <span>High activity</span>
                </div>
            </div>
        </div>
    )
}

// Stats Card Component
interface StatsCardProps {
    icon: React.ReactNode
    title: string
    value: string | number
    subtitle: string
    color: 'purple' | 'cyan' | 'orange'
    progress?: number
}

function StatsCard({ icon, title, value, subtitle, color, progress }: StatsCardProps) {
    const colorClasses = {
        purple: 'from-purple-600 to-purple-700',
        cyan: 'from-cyan-600 to-cyan-700',
        orange: 'from-orange-600 to-orange-700'
    }

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white`}>
                    {icon}
                </div>
                <div className="text-xs text-gray-400">{title}</div>
            </div>

            <div className="text-3xl font-bold mb-2">{value}</div>
            <div className="text-sm text-gray-400">{subtitle}</div>

            {progress !== undefined && (
                <div className="mt-4">
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full bg-gradient-to-r ${colorClasses[color]}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

// Activity Heatmap Component
function ActivityHeatmap({ activity }: { activity: Activity[] }) {
    const getLevelColor = (level: string) => {
        switch (level) {
            case 'none': return 'bg-zinc-800'
            case 'low': return 'bg-cyan-900/40'
            case 'medium': return 'bg-cyan-600/60'
            case 'high': return 'bg-cyan-500'
            default: return 'bg-zinc-800'
        }
    }

    // Группируем по неделям (7 дней)
    const weeks: Activity[][] = []
    for (let i = 0; i < activity.length; i += 7) {
        weeks.push(activity.slice(i, i + 7))
    }

    return (
        <div className="overflow-x-auto">
            <div className="inline-flex gap-1">
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1">
                        {week.map((day, dayIndex) => (
                            <div
                                key={day.date}
                                className={`w-3 h-3 rounded-sm ${getLevelColor(day.level)} hover:ring-2 hover:ring-cyan-500 transition-all cursor-pointer`}
                                title={`${day.date}: ${day.count} messages`}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

// Roadmap Item Component
interface RoadmapItemProps {
    title: string
    description: string
    progress: number
    status: 'completed' | 'in-progress' | 'planned'
}

function RoadmapItem({ title, description, progress, status }: RoadmapItemProps) {
    const getStatusIcon = () => {
        switch (status) {
            case 'completed':
                return (
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )
            case 'in-progress':
                return (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-white">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                )
            case 'planned':
                return (
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-gray-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                )
        }
    }

    const getStatusBadge = () => {
        switch (status) {
            case 'completed':
                return <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-xs font-medium">Completed</span>
            case 'in-progress':
                return <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-xs font-medium">In Progress</span>
            case 'planned':
                return <span className="px-3 py-1 bg-zinc-800 text-gray-400 rounded-full text-xs font-medium">Planned</span>
        }
    }

    return (
        <div className="relative flex items-start gap-4 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
            {/* Status Icon */}
            <div className="flex-shrink-0 relative">
                {getStatusIcon()}
                {status !== 'planned' && (
                    <div className="absolute left-1/2 top-12 w-0.5 h-8 bg-gradient-to-b from-purple-600 to-transparent -ml-px" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    {getStatusBadge()}
                </div>

                <p className="text-sm text-gray-400 mb-3">{description}</p>

                {/* Progress Bar */}
                {status !== 'planned' && (
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">{progress}% complete</span>
                            {status === 'completed' && <span className="text-green-400">100% complete</span>}
                        </div>
                        <div className="w-full bg-zinc-700 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all ${
                                    status === 'completed'
                                        ? 'bg-gradient-to-r from-green-600 to-green-500'
                                        : 'bg-gradient-to-r from-purple-600 to-cyan-600'
                                }`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {status === 'planned' && (
                    <div className="text-xs text-gray-500">Not started</div>
                )}
            </div>
        </div>
    )
}
