'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Search, Menu } from 'lucide-react'
import { Input, Avatar, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react'
import { useAuthStore } from '../../store/authSlice'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '')

interface TopBarProps {
  onMenuClick?: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ users: any[]; communities: any[] } | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      setShowDropdown(false)
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await api.get(`/users/search/global?q=${encodeURIComponent(searchQuery)}`)
        setSearchResults(res.data)
        setShowDropdown(true)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  return (
    <header className="h-20 border-b border-divider bg-background/70 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        <button className="md:hidden text-default-500" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        
        <div ref={searchContainerRef} className="hidden md:flex w-full max-w-md relative">
          <Input
            classNames={{
              base: "max-w-full sm:max-w-[24rem] h-10",
              mainWrapper: "h-full",
              input: "text-small",
              inputWrapper: "h-full font-normal text-default-500 bg-default-400/20 dark:bg-default-500/20",
            }}
            placeholder="Search communities, people..."
            size="sm"
            startContent={<Search size={18} />}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setShowDropdown(true)}
          />

          {showDropdown && searchResults && (
            <div className="absolute top-[105%] left-0 w-full sm:max-w-[24rem] bg-background border border-divider rounded-xl shadow-xl z-50 flex flex-col max-h-[350px] overflow-y-auto p-2">
              {isSearching && (
                <div className="p-3 text-center text-xs text-default-400 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Searching...
                </div>
              )}

              {!isSearching && searchResults.users.length === 0 && searchResults.communities.length === 0 && (
                <div className="p-4 text-center text-sm text-default-400">
                  No results found for "{searchQuery}"
                </div>
              )}

              {!isSearching && (
                <>
                  {searchResults.users.length > 0 && (
                    <div className="flex flex-col">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-default-400 uppercase tracking-wider">
                        People
                      </div>
                      {searchResults.users.map((u: any) => (
                        <div
                          key={`user-${u.id}`}
                          onClick={() => {
                            if (u.id === user?.id) {
                              router.push('/profile/me')
                            } else {
                              router.push(`/profile/${u.id}`)
                            }
                            setSearchQuery('')
                            setShowDropdown(false)
                          }}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-100 hover:text-blue-900 cursor-pointer transition-all hover-lift"
                        >
                          <Avatar
                            size="sm"
                            src={u.profile_photo ? `${BACKEND_URL}${u.profile_photo}` : undefined}
                            name={u.username?.charAt(0).toUpperCase()}
                            color="primary"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-foreground">
                              {u.first_name || u.username} {u.last_name || ''}
                            </span>
                            <span className="text-[10px] text-default-400">@{u.username}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.communities.length > 0 && (
                    <div className="flex flex-col mt-2">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-default-400 uppercase tracking-wider">
                        Communities
                      </div>
                      {searchResults.communities.map((c: any) => (
                        <div
                          key={`comm-${c.id}`}
                          onClick={() => {
                            router.push(`/communities/${c.id}`)
                            setSearchQuery('')
                            setShowDropdown(false)
                          }}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-100 hover:text-blue-900 cursor-pointer transition-all hover-lift"
                        >
                          <Avatar
                            size="sm"
                            src={c.icon ? `${BACKEND_URL}${c.icon}` : undefined}
                            name={c.name?.charAt(0).toUpperCase()}
                            color="secondary"
                            radius="md"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-foreground">{c.name}</span>
                            <span className="text-[10px] text-default-400">
                              {c.total_members} member{c.total_members !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">

        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Avatar
              isBordered
              as="button"
              className="transition-transform"
              color="primary"
              name={user?.username?.charAt(0).toUpperCase() || 'U'}
              size="sm"
              src={user?.profile_photo ? `${BACKEND_URL}${user.profile_photo}` : undefined}
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat">
            <DropdownItem key="profile" className="h-14 gap-2">
              <p className="font-semibold">Signed in as</p>
              <p className="font-semibold">{user?.email}</p>
            </DropdownItem>
            <DropdownItem key="settings" onClick={() => router.push('/profile/me/edit')}>
              My Settings
            </DropdownItem>
            <DropdownItem key="logout" color="danger" onClick={handleLogout}>
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </header>
  )
}
