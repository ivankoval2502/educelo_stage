'use client'

import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from '@/lib/context/AuthContext'

export default function ProtectedRoute({children}: {children: React.ReactNode}) {
    const {user, loading} = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth')
        }
    }, [user, loading, router]);

    // Showing the loading page while the token is checking
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <div className="text-white text-xl">Loading...</div>
            </div>
        )
    }

    // If a user doesn't exist, we show the empty page
    if (!user) {
        return null
    }

    return (
        <>
            {children}
        </>
    )
}