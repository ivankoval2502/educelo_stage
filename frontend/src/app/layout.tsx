import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";
import {AuthProvider}from '@/lib/context/AuthContext'
import ToastProvider from '@/components/ToastProvider'

const raleway = Raleway({
    subsets: ['latin', 'cyrillic']
})

export const metadata: Metadata = {
    title: "Educelo - Your AI-Powered Learning Companion",
    robots: "index, follow",
    description: "Discover personalized AI-powered learning tailored for every goal. Speed up skill acquisition with adaptive lessons, interactive practice, and real-time feedback. Join our community and unlock smarter education.",
    keywords: "AI learning platform, personalized education, adaptive learning, interactive courses, skill development, AI tutor, online education, e-learning platform, personalized study plan, educational technology",
    icons: {
        icon: '/images/logo.svg',
    }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={raleway.className}>
      <body>
        <AuthProvider>
            <ToastProvider/>
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}
