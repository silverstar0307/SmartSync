'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Compass, Bell, User as UserIcon, Settings, X, MessageSquare } from 'lucide-react'
import { Button } from '@nextui-org/react'

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Communities', href: '/communities', icon: Users },
    { name: 'AI Rec.', href: '/connections', icon: Compass },
    { name: 'Interests', href: '/interests', icon: Compass },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Profile', href: '/profile/me', icon: UserIcon },
  ]

  const handleLinkClick = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="w-64 h-full bg-slate-50 border-r border-slate-200 flex flex-col">
      <div className="p-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-lg">S</div>
          Smart Sync
        </h1>
        {onClose && (
          <Button 
            isIconOnly 
            variant="light" 
            size="sm" 
            onClick={onClose}
            className="md:hidden"
          >
            <X size={20} />
          </Button>
        )}
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover-lift ${
                isActive 
                  ? 'bg-blue-500 text-white font-medium shadow-md shadow-blue-500/30' 
                  : 'text-slate-900 hover:bg-blue-100 hover:text-blue-800'
              }`}
            >
              <link.icon size={20} />
              {link.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <Link
          href="/settings"
          onClick={handleLinkClick}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-900 hover:bg-blue-100 hover:text-blue-800 transition-colors hover-lift"
        >
          <Settings size={20} />
          Settings
        </Link>
      </div>
    </div>
  )
}
