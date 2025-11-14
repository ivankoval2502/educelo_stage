'use client'

import {Toaster} from 'react-hot-toast'

export default function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#18181b',
                    color: '#fff',
                    border: '1px solid #27272a',
                    padding: '12px',
                    fontSize: '16px',
                },
                success: {
                    iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                    },
                },
                error: {
                    iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                    }
                }
            }}
        />
    )
}