'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardBody, Button, Input, Chip, Avatar, Spinner, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react'
import { Search, Send, Info, MessageSquare, Paperclip, Smile, UserMinus, ShieldOff, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/store/authSlice'
import api from '@/lib/api'

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '')

export default function ConnectionsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  
  const [connections, setConnections] = useState<any[]>([])
  const [activeConnection, setActiveConnection] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  
  const [isConnectionsLoading, setIsConnectionsLoading] = useState(true)
  const [isMessagesLoading, setIsMessagesLoading] = useState(false)
  const [leftSearch, setLeftSearch] = useState('')
  const [messageText, setMessageText] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [showRightPanel, setShowRightPanel] = useState(true)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch all connections (friends)
  const fetchConnections = async () => {
    try {
      const response = await api.get('/connections')
      setConnections(response.data)
    } catch (error) {
      console.error('Failed to fetch connections list', error)
    } finally {
      setIsConnectionsLoading(false)
    }
  }

  // Fetch messages with active connection
  const fetchMessages = async (friendId: number) => {
    try {
      const response = await api.get(`/connections/chat/${friendId}`)
      setMessages(response.data)
    } catch (error) {
      console.error('Failed to fetch messages', error)
    }
  }

  useEffect(() => {
    fetchConnections()
  }, [])

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Poll for new messages when a connection is active
  useEffect(() => {
    if (!activeConnection) return
    
    // Initial fetch
    setIsMessagesLoading(true)
    fetchMessages(activeConnection.id).finally(() => {
      setIsMessagesLoading(false)
    })

    const interval = setInterval(() => {
      fetchMessages(activeConnection.id)
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [activeConnection])

  // Filter connections list
  const filteredConnections = useMemo(() => {
    return connections.filter(c => {
      const name = `${c.first_name || ''} ${c.last_name || ''} ${c.username || ''}`.toLowerCase()
      return name.includes(leftSearch.toLowerCase())
    })
  }, [connections, leftSearch])

  // Send Direct Message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeConnection) return
    setIsSendingMessage(true)
    try {
      const response = await api.post(`/connections/chat/${activeConnection.id}`, {
        content: messageText
      })
      setMessages(prev => [...prev, response.data])
      setMessageText('')
    } catch (error: any) {
      console.error('Failed to send message', error)
      alert(error.response?.data?.message || 'Error sending message.')
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleDisconnectFromChat = async (friendId: number) => {
    if (!window.confirm('Are you sure you want to disconnect from this user?')) return
    try {
      await api.post(`/connections/disconnect/${friendId}`)
      setConnections(prev => prev.filter(c => c.id !== friendId))
      setActiveConnection(null)
      alert('Disconnected successfully.')
    } catch (error: any) {
      console.error(error)
      alert(error.response?.data?.message || 'Failed to disconnect.')
    }
  }

  const handleBlockFromChat = async (friendId: number) => {
    if (!window.confirm('Are you sure you want to block this user? They will not be able to message you or send connection requests.')) return
    try {
      await api.post(`/connections/block/${friendId}`)
      setConnections(prev => prev.filter(c => c.id !== friendId))
      setActiveConnection(null)
      alert('User blocked.')
    } catch (error: any) {
      console.error(error)
      alert(error.response?.data?.message || 'Failed to block user.')
    }
  }

  return (
    <div className="flex h-[calc(100vh-80px)] -m-6 overflow-hidden bg-content1 border-t border-divider">
      {/* COLUMN 1: LEFT SIDEBAR - Connected Students */}
      <div className="w-80 border-r border-divider flex flex-col bg-default-50/50 shrink-0">
        <div className="p-4 border-b border-divider flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg">Connections</h2>
          </div>
          <Input
            size="sm"
            placeholder="Search connections..."
            startContent={<Search size={16} className="text-default-400" />}
            value={leftSearch}
            onChange={(e) => setLeftSearch(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isConnectionsLoading ? (
            <div className="p-4 text-center text-default-400">
              <Spinner size="sm" />
            </div>
          ) : filteredConnections.length === 0 ? (
            <div className="p-4 text-center text-sm text-default-400">
              {leftSearch ? 'No connections match your search.' : 'You have no connections yet.'}
            </div>
          ) : (
            filteredConnections.map((c) => {
              const isActive = activeConnection?.id === c.id
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveConnection(c)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'hover:bg-default-100 text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar
                      src={c.profile_photo ? `${BACKEND_URL}${c.profile_photo}` : undefined}
                      name={c.username.charAt(0).toUpperCase()}
                      className={isActive ? 'bg-primary-foreground text-primary font-bold' : 'bg-primary/20 text-primary font-bold'}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {c.first_name || c.last_name 
                          ? `${c.first_name || ''} ${c.last_name || ''}`.trim()
                          : c.username}
                      </p>
                      <p className={`text-xs truncate ${isActive ? 'text-primary-foreground/80' : 'text-default-400'}`}>
                        {c.bio || 'Student Connection'}
                      </p>
                    </div>
                  </div>
                  
                  {!isActive && (
                    <Button 
                      size="sm" 
                      color="primary" 
                      variant="flat" 
                      className="ml-2 font-medium bg-primary/10 hover:bg-primary/20 shrink-0 text-xs py-1 px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveConnection(c);
                      }}
                    >
                      Chat
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* COLUMN 2: MIDDLE PANEL - Main Chat */}
      <div className="flex-1 flex flex-col bg-default-50/20 relative">
        {activeConnection ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-divider px-6 flex items-center justify-between bg-content1 shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                <Avatar
                  src={activeConnection.profile_photo ? `${BACKEND_URL}${activeConnection.profile_photo}` : undefined}
                  name={activeConnection.username.charAt(0).toUpperCase()}
                  className="bg-primary/20 text-primary font-bold"
                  size="sm"
                />
                <div>
                  <h3 className="font-bold text-sm leading-none">
                    {activeConnection.first_name || activeConnection.last_name 
                      ? `${activeConnection.first_name || ''} ${activeConnection.last_name || ''}`.trim()
                      : activeConnection.username}
                  </h3>
                  <p className="text-[10px] text-success mt-1 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
                    Connected
                  </p>
                </div>
              </div>

              <Button 
                size="sm" 
                variant="light" 
                isIconOnly 
                onClick={() => setShowRightPanel(prev => !prev)}
                color={showRightPanel ? 'primary' : 'default'}
              >
                <Info size={20} />
              </Button>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-default-100/30">
              {isMessagesLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Spinner label="Loading messages..." />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-default-400 gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">No Messages Yet</p>
                    <p className="text-xs max-w-xs mt-1">Start the conversation by sending a direct message to this student!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm border ${
                        isOwn 
                          ? 'bg-primary text-primary-foreground border-primary/20' 
                          : 'bg-content1 text-foreground border-divider'
                      }`}>
                        <div className="flex justify-between items-center mb-1 gap-4">
                          <span className={`font-bold text-xs ${isOwn ? 'text-primary-foreground/90' : 'text-primary'}`}>
                            {isOwn ? 'You' : msg.sender_username}
                          </span>
                          <span className={`text-[9px] ${isOwn ? 'text-primary-foreground/75' : 'text-default-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm break-words leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Area */}
            <div className="p-4 border-t border-divider bg-content1 flex items-center gap-3 shrink-0">
              <div className="flex-1 bg-default-100/50 rounded-xl px-4 py-2 flex items-center gap-3 border border-divider">
                <Button size="sm" isIconOnly variant="light" className="text-default-400 min-w-0 w-8 h-8">
                  <Paperclip size={18} />
                </Button>
                <input
                  placeholder={`Send a message to ${activeConnection.username}...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage()
                  }}
                  className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-default-400"
                />
                <Button size="sm" isIconOnly variant="light" className="text-default-400 min-w-0 w-8 h-8">
                  <Smile size={18} />
                </Button>
              </div>
              <Button 
                color="primary" 
                onClick={handleSendMessage} 
                isLoading={isSendingMessage} 
                isDisabled={!messageText.trim()}
                className="min-w-0 w-12 h-12 rounded-xl"
              >
                <Send size={18} />
              </Button>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-default-400 gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center text-primary">
              <MessageSquare size={32} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">Sync Messages</h3>
              <p className="text-xs max-w-sm mt-1">Select a connected student from the sidebar to view details, retrieve past conversations, and start chatting.</p>
            </div>
          </div>
        )}
      </div>

      {/* COLUMN 3: RIGHT PANEL - Student Details */}
      {showRightPanel && activeConnection && (
        <div className="w-96 border-l border-divider flex flex-col bg-content1 shrink-0">
          {/* Info Header */}
          <div className="h-16 border-b border-divider px-4 flex items-center justify-between shrink-0">
            <h4 className="font-bold text-sm">Student Profile</h4>
            <Button size="sm" variant="light" isIconOnly onClick={() => setShowRightPanel(false)}>
              ✕
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Logo, Name, Details */}
            <div className="flex flex-col items-center text-center pb-6 border-b border-divider gap-3">
              <Avatar
                src={activeConnection.profile_photo ? `${BACKEND_URL}${activeConnection.profile_photo}` : undefined}
                name={activeConnection.username.charAt(0).toUpperCase()}
                className="w-24 h-24 text-3xl font-bold bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20"
              />
              <div>
                <h3 className="font-bold text-lg leading-tight">
                  {activeConnection.first_name || activeConnection.last_name 
                    ? `${activeConnection.first_name || ''} ${activeConnection.last_name || ''}`.trim()
                    : activeConnection.username}
                </h3>
                <p className="text-xs text-default-400 mt-1">@{activeConnection.username}</p>
              </div>
              
              {activeConnection.college_name && (
                <Chip size="sm" color="primary" variant="flat" className="mt-1">
                  {activeConnection.college_name}
                </Chip>
              )}

              <div className="flex items-center gap-2 mt-2">
                <Button
                  size="sm"
                  color="secondary"
                  variant="flat"
                  className="font-medium"
                  onClick={() => router.push(`/profile/${activeConnection.id}`)}
                >
                  View Profile
                </Button>
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <Button size="sm" variant="flat" color="default" isIconOnly>
                      <ChevronDown size={16} />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Connection options">
                    <DropdownItem
                      key="disconnect"
                      startContent={<UserMinus size={16} className="text-warning-600" />}
                      className="text-warning-700 font-medium"
                      onClick={() => handleDisconnectFromChat(activeConnection.id)}
                    >
                      Disconnect
                    </DropdownItem>
                    <DropdownItem
                      key="block"
                      startContent={<ShieldOff size={16} className="text-danger" />}
                      color="danger"
                      className="text-danger font-medium"
                      onClick={() => handleBlockFromChat(activeConnection.id)}
                    >
                      Block User
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>

            {/* Profile info */}
            <div className="space-y-4 pb-4 border-b border-divider">
              <div>
                <h5 className="text-xs font-bold text-default-400 uppercase tracking-wider mb-1">About Student</h5>
                <p className="text-sm text-default-600 leading-relaxed">
                  {activeConnection.bio || 'This student hasn\'t added a bio details yet.'}
                </p>
              </div>

              {activeConnection.class && (
                <div>
                  <h5 className="text-xs font-bold text-default-400 uppercase tracking-wider mb-1">Academic Year</h5>
                  <p className="text-sm text-default-600">
                    {activeConnection.class} {activeConnection.division ? `(Div ${activeConnection.division})` : ''}
                  </p>
                </div>
              )}

              {activeConnection.interests && activeConnection.interests.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-default-400 uppercase tracking-wider mb-2">Interests</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {activeConnection.interests.map((interest: string) => (
                      <Chip key={interest} size="sm" variant="flat" className="bg-default-100">
                        {interest}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
