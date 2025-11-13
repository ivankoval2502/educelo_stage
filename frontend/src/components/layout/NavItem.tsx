import {FC, ReactNode} from 'react'
import Link from 'next/link'

interface NavItemProps {
    href: string
    icon: ReactNode
    label: string
    active?: boolean
    onClick?: () => void
}

const NavItem: FC<NavItemProps> = ({ href, icon, label, active, onClick }) => {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                active
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:bg-zinc-800 hover:text-white'
            }`}
        >
            <span className="text-xl">{icon}</span>
            <span className="font-medium">{label}</span>
        </Link>
    )
}

export default NavItem
