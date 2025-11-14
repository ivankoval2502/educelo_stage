'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, updateUserProfile, changePassword, updateWeeklyGoal } from '@/lib/api'
import { User, Lock, Target, LogOut, Save } from 'lucide-react'
import {showSuccess, showError} from "@/lib/toast";

interface UserData {
    user_id: string
    username: string
    email: string
    weekly_goal_hours: number
    goal_last_updated: string | null
}

export default function SettingsPage() {
    const router = useRouter()
    const [userData, setUserData] = useState<UserData | null>(null)
    const [loading, setLoading] = useState(true)

    // Profile form
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [profileSaving, setProfileSaving] = useState(false)

    // Password form
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [passwordSaving, setPasswordSaving] = useState(false)

    // Goal form
    const [weeklyGoal, setWeeklyGoal] = useState(10)
    const [goalSaving, setGoalSaving] = useState(false)
    const [goalError, setGoalError] = useState('')

    useEffect(() => {
        loadUserData()
    }, [])

    const loadUserData = async () => {
        try {
            const data = await getCurrentUser()
            setUserData(data)
            setUsername(data.username)
            setEmail(data.email)
            setWeeklyGoal(data.weekly_goal_hours)
        } catch (error) {
            console.error('Failed to load user data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setProfileSaving(true)

        try {
            await updateUserProfile({ username, email })
            showSuccess("Profile updated successfully!");
            await loadUserData()
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update profile'
            showError(errorMessage);
        } finally {
            setProfileSaving(false)
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword.length < 8) {
            showError("New password must be at least 8 characters long");
            return
        }

        setPasswordSaving(true)

        try {
            await changePassword(currentPassword, newPassword)
            showSuccess("Password changed successfully!");
            setCurrentPassword('')
            setNewPassword('')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to change password'
            showError(errorMessage);
        } finally {
            setPasswordSaving(false)
        }
    }

    const handleUpdateGoal = async (e: React.FormEvent) => {
        e.preventDefault()
        setGoalError('')
        setGoalSaving(true)

        try {
            const result = await updateWeeklyGoal(weeklyGoal)
            showSuccess(`Weekly goal updated successfully! Next update available: ${result.next_update_available}`);
            await loadUserData()
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update goal'
            setGoalError(errorMessage)
        } finally {
            setGoalSaving(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('access_token')
        router.push('/auth')
    }

    const canUpdateGoal = () => {
        if (!userData?.goal_last_updated) return true

        const lastUpdate = new Date(userData.goal_last_updated)
        const daysSince = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
        return daysSince >= 7
    }

    const getDaysUntilNextUpdate = () => {
        if (!userData?.goal_last_updated) return 0

        const lastUpdate = new Date(userData.goal_last_updated)
        const daysSince = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
        return Math.max(0, 7 - daysSince)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-400">Loading...</div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <div className="space-y-6">
                {/* Profile Settings */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
                            <User size={20} className="text-white" />
                        </div>
                        <h2 className="text-xl font-semibold">Profile Settings</h2>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-600"
                                required
                                minLength={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-600"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={profileSaving}
                            className="flex items-center gap-2 px-6 py-3 cursor-pointer bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            <Save size={18} />
                            {profileSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>

                {/* Change Password */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center">
                            <Lock size={20} className="text-white" />
                        </div>
                        <h2 className="text-xl font-semibold">Change Password</h2>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-600"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-600"
                                required
                                minLength={8}
                            />
                            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                        </div>

                        <button
                            type="submit"
                            disabled={passwordSaving}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r cursor-pointer from-orange-600 to-orange-700 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            <Lock size={18} />
                            {passwordSaving ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
                </div>

                {/* Weekly Goal */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600 to-cyan-700 flex items-center justify-center">
                            <Target size={20} className="text-white" />
                        </div>
                        <h2 className="text-xl font-semibold">Weekly Learning Goal</h2>
                    </div>

                    <form onSubmit={handleUpdateGoal} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Weekly Goal (hours)
                            </label>
                            <input
                                type="number"
                                value={weeklyGoal}
                                onChange={(e) => setWeeklyGoal(parseInt(e.target.value))}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                                min={1}
                                max={100}
                                required
                                disabled={!canUpdateGoal()}
                            />

                            {!canUpdateGoal() && (
                                <p className="text-sm text-orange-400 mt-2">
                                    ⏰ You can update your goal again in {getDaysUntilNextUpdate()} days
                                </p>
                            )}

                            {userData?.goal_last_updated && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Last updated: {new Date(userData.goal_last_updated).toLocaleDateString()}
                                </p>
                            )}
                        </div>

                        {goalError && (
                            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                                {goalError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={goalSaving || !canUpdateGoal()}
                            className="flex items-center gap-2 px-6 py-3 cursor-pointer bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Target size={18} />
                            {goalSaving ? 'Updating...' : 'Update Goal'}
                        </button>
                    </form>
                </div>

                {/* Account Actions */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                            <LogOut size={20} className="text-white" />
                        </div>
                        <h2 className="text-xl font-semibold">Account</h2>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-6 py-3 cursor-pointer bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    )
}
