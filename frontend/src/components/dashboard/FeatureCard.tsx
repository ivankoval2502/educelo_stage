import { FC, ReactNode } from 'react'
import Link from 'next/link'

interface FeatureCardProps {
    title: string
    description: string
    icon: ReactNode
    href: string
    iconBg: string // Градиент для иконки
}

const FeatureCard: FC<FeatureCardProps> = ({ title, description, icon, href, iconBg }) => {
    return (
        <Link href={href}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-purple-600 transition-all cursor-pointer group min-h-56">
                <div className="flex items-start justify-between">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                        {icon}
                    </div>

                    {/* Arrow */}
                    <div className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all">
                        →
                    </div>
                </div>

                {/* Text */}
                <h3 className="text-xl font-semibold mt-4 mb-2">{title}</h3>
                <p className="text-sm text-gray-400">{description}</p>
            </div>
        </Link>
    )
}

export default FeatureCard
