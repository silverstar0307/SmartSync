'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardBody, Button, Input, Chip, Avatar, Spinner, Textarea, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react'
import { Search, Users, Send, Info, Plus, Heart, MessageSquare, ArrowLeft, ShieldAlert, Edit, Upload, Sparkles, Check, Paperclip, Smile, FileText, Image, Video, Trophy, CheckSquare, BarChart2, Mic } from 'lucide-react'
import { useAuthStore } from '@/store/authSlice'
import api from '@/lib/api'
import ChallengeModal from '@/components/Challenge/ChallengeModal'
import ChallengeCard from '@/components/Challenge/ChallengeCard'

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '')

export default function CommunityDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  
  const [currentCommunity, setCurrentCommunity] = useState<any>(null)
  const [joinedCommunities, setJoinedCommunities] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  
  const [isCommunityLoading, setIsCommunityLoading] = useState(true)
  const [isListLoading, setIsListLoading] = useState(true)
  const [isPostsLoading, setIsPostsLoading] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [leftSearch, setLeftSearch] = useState('')
  const [showRightPanel, setShowRightPanel] = useState(true)

  // Create Post Modal State
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false)

  // Edit Community State
  const { isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: onEditOpenChange } = useDisclosure()
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDomain, setEditDomain] = useState('')
  const [editTagsString, setEditTagsString] = useState('')
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [isSavingCommunity, setIsSavingCommunity] = useState(false)

  // Add Members State
  const { isOpen: isAddOpen, onOpen: onAddOpen, onOpenChange: onAddOpenChange } = useDisclosure()
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [searchedMembers, setSearchedMembers] = useState<any[]>([])
  const [isSearchingMembers, setIsSearchingMembers] = useState(false)
  const [searchMode, setSearchMode] = useState<'manual' | 'ai'>('manual')

  // Chat Messaging State
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [chatInputText, setChatInputText] = useState('')
  const [isSendingChatMessage, setIsSendingChatMessage] = useState(false)
  
  // File Upload states for Chat
  const [selectedChatFile, setSelectedChatFile] = useState<File | null>(null)
  const [chatFilePreview, setChatFilePreview] = useState<string | null>(null)
  const [isUploadingChatFile, setIsUploadingChatFile] = useState(false)
  const chatMessagesEndRef = useRef<HTMLDivElement>(null)

  const handleOpenEdit = () => {
    if (!currentCommunity) return
    setEditName(currentCommunity.name || '')
    setEditDescription(currentCommunity.description || '')
    setEditDomain(currentCommunity.domain || '')
    setEditTagsString((currentCommunity.tags || []).join(', '))
    setSelectedLogoFile(null)
    setLogoPreviewUrl(currentCommunity.icon ? `${BACKEND_URL}${currentCommunity.icon}` : null)
    onEditOpen()
  }

  const handleSaveCommunity = async (onClose: () => void) => {
    if (!editName.trim()) return
    setIsSavingCommunity(true)
    try {
      // 1. Upload Logo if selected
      let uploadedLogoUrl = null
      if (selectedLogoFile) {
        const formData = new FormData()
        formData.append('logo', selectedLogoFile)
        const uploadRes = await api.post(`/communities/${id}/logo`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        uploadedLogoUrl = uploadRes.data.icon
      }

      // 2. Save details
      const tags = editTagsString.split(',').map(t => t.trim()).filter(t => t !== '')
      const response = await api.put(`/communities/${id}`, {
        name: editName.trim(),
        description: editDescription.trim(),
        domain: editDomain.trim(),
        tags
      })

      // Update local state
      setCurrentCommunity((prev: any) => ({
        ...prev,
        ...response.data,
        icon: uploadedLogoUrl || response.data.icon || prev.icon
      }))
      
      // Refresh list
      fetchJoinedCommunities()
      onClose()
    } catch (error) {
      console.error('Failed to save community details', error)
      alert('Error updating community details.')
    } finally {
      setIsSavingCommunity(false)
    }
  }

  const handleSearchMembers = async (mode: 'manual' | 'ai') => {
    setIsSearchingMembers(true)
    setSearchMode(mode)
    try {
      const isAI = mode === 'ai'
      const url = `/communities/${id}/search-members?ai=${isAI ? 'true' : 'false'}&query=${encodeURIComponent(memberSearchQuery)}`
      const response = await api.get(url)
      setSearchedMembers(response.data)
    } catch (error) {
      console.error('Failed to search members', error)
    } finally {
      setIsSearchingMembers(false)
    }
  }

  const handleAddMember = async (userId: number) => {
    try {
      await api.post(`/communities/${id}/invite`, { userId })
      setSearchedMembers(prev => prev.map(m => m.id === userId ? { ...m, isInvited: true } : m))
      alert('Invitation sent to candidate notification box!')
    } catch (error: any) {
      console.error('Failed to invite member', error)
      alert(error.response?.data?.message || 'Error inviting member.')
    }
  }

  // Fetch all communities to filter user's joined list
  const fetchJoinedCommunities = async () => {
    try {
      const response = await api.get('/communities')
      const userJoined = response.data.filter((c: any) => c.members?.includes(user?.id))
      setJoinedCommunities(userJoined)
    } catch (error) {
      console.error('Failed to fetch communities list', error)
    } finally {
      setIsListLoading(false)
    }
  }

  // Fetch details of active community
  const fetchActiveCommunity = async () => {
    if (!id) return
    setIsCommunityLoading(true)
    try {
      const response = await api.get(`/communities/${id}`)
      setCurrentCommunity(response.data)
    } catch (error) {
      console.error('Failed to fetch active community details', error)
    } finally {
      setIsCommunityLoading(false)
    }
  }

  // Fetch community posts
  const fetchCommunityPosts = async () => {
    if (!id) return
    setIsPostsLoading(true)
    try {
      const response = await api.get(`/posts/community/${id}`)
      setPosts(response.data)
    } catch (error) {
      console.error('Failed to fetch community posts', error)
    } finally {
      setIsPostsLoading(false)
    }
  }

  const fetchChatMessages = async () => {
    if (!id) return
    try {
      const response = await api.get(`/communities/${id}/messages`)
      setChatMessages(response.data)
    } catch (error) {
      console.error('Failed to fetch community messages', error)
    }
  }

  const handleSendChatMessage = async () => {
    if (!chatInputText.trim() && !selectedChatFile) return
    setIsSendingChatMessage(true)
    try {
      let mediaUrls: string[] = []
      
      // 1. Upload file if selected
      if (selectedChatFile) {
        setIsUploadingChatFile(true)
        const formData = new FormData()
        formData.append('file', selectedChatFile)
        const uploadRes = await api.post(`/communities/${id}/messages/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        mediaUrls.push(uploadRes.data.fileUrl)
        setSelectedChatFile(null)
        setChatFilePreview(null)
        setIsUploadingChatFile(false)
      }

      // 2. Post message
      const response = await api.post(`/communities/${id}/messages`, {
        content: chatInputText.trim(),
        media: mediaUrls
      })

      setChatMessages(prev => [...prev, response.data])
      setChatInputText('')
    } catch (error) {
      console.error('Failed to send community message', error)
      alert('Error sending message.')
    } finally {
      setIsSendingChatMessage(false)
    }
  }

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    if (id) {
      fetchActiveCommunity()
      fetchJoinedCommunities()
      fetchCommunityPosts()

      // Initial chat load
      setIsChatLoading(true)
      fetchChatMessages().finally(() => {
        setIsChatLoading(false)
      })

      // Polling for chat messages
      const interval = setInterval(() => {
        fetchChatMessages()
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [id])

  // Filter joined communities list
  const filteredJoinedCommunities = useMemo(() => {
    return joinedCommunities.filter(c => 
      c.name.toLowerCase().includes(leftSearch.toLowerCase())
    )
  }, [joinedCommunities, leftSearch])

  // Create a post handler
  const handleCreatePost = async (onClose: () => void) => {
    if (!postContent.trim()) return
    setIsCreatingPost(true)
    try {
      await api.post('/posts', {
        title: postTitle.trim() || `Update in ${currentCommunity?.name}`,
        content: postContent,
        community_id: parseInt(id as string)
      })
      setPostTitle('')
      setPostContent('')
      onClose()
      fetchCommunityPosts() // Reload posts
    } catch (error) {
      console.error('Failed to create post', error)
      alert('Error creating post.')
    } finally {
      setIsCreatingPost(false)
    }
  }

  const handleLeaveCommunity = async () => {
    if (!window.confirm('Are you sure you want to leave this community?')) return
    setIsLeaving(true)
    try {
      await api.post(`/communities/${id}/leave`)
      alert('You have left the community.')
      router.push('/communities')
    } catch (error: any) {
      console.error('Failed to leave community', error)
      alert(error.response?.data?.message || 'Error leaving community.')
    } finally {
      setIsLeaving(false)
    }
  }

  const handleDeleteCommunity = async () => {
    if (!window.confirm('WARNING: Are you sure you want to delete this community permanently? All messages, posts, images, and videos will be deleted permanently.')) return
    setIsDeleting(true)
    try {
      await api.delete(`/communities/${id}`)
      alert('Community deleted successfully.')
      router.push('/communities')
    } catch (error: any) {
      console.error('Failed to delete community', error)
      alert(error.response?.data?.message || 'Error deleting community.')
    } finally {
      setIsDeleting(false)
    }
  }



  if (isCommunityLoading && !currentCommunity) {
    return (
      <div className="h-[75vh] w-full flex items-center justify-center">
        <Spinner size="lg" label="Loading Community Dashboard..." />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-80px)] -m-6 overflow-hidden bg-content1 border-t border-divider">
      {/* COLUMN 1: LEFT SIDEBAR - User's Joined Communities */}
      <div className="w-80 border-r border-divider flex flex-col bg-default-50/50 shrink-0">
        <div className="p-4 border-b border-divider flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Button size="sm" isIconOnly variant="light" onClick={() => router.push('/communities')}>
              <ArrowLeft size={18} />
            </Button>
            <h2 className="font-bold text-lg">My Communities</h2>
          </div>
          <Input
            size="sm"
            placeholder="Search my chats..."
            startContent={<Search size={16} className="text-default-400" />}
            value={leftSearch}
            onChange={(e) => setLeftSearch(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isListLoading ? (
            <div className="p-4 text-center text-default-400">
              <Spinner size="sm" />
            </div>
          ) : filteredJoinedCommunities.length === 0 ? (
            <div className="p-4 text-center text-sm text-default-400">
              No joined communities found.
            </div>
          ) : (
            filteredJoinedCommunities.map((c) => {
              const isActive = c.id === parseInt(id as string)
              return (
                <div
                  key={c.id}
                  onClick={() => router.push(`/communities/${c.id}`)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'hover:bg-default-100 text-foreground'
                  }`}
                >
                  <Avatar
                    src={c.icon ? `${BACKEND_URL}${c.icon}` : undefined}
                    name={c.name.charAt(0).toUpperCase()}
                    className={isActive ? 'bg-primary-foreground text-primary font-bold' : 'bg-primary/20 text-primary font-bold'}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{c.name}</p>
                    <p className={`text-xs truncate ${isActive ? 'text-primary-foreground/80' : 'text-default-400'}`}>
                      {c.description || 'No description...'}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* COLUMN 2: MIDDLE PANEL - Main Chat (Temporarily Disabled) */}
      <div className="flex-1 flex flex-col bg-default-50/20 relative">
        {/* Chat Header */}
        <div className="h-16 border-b border-divider px-6 flex items-center justify-between bg-content1 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <Avatar
              src={currentCommunity?.icon ? `${BACKEND_URL}${currentCommunity.icon}` : undefined}
              name={currentCommunity?.name?.charAt(0).toUpperCase() || 'C'}
              className="bg-primary/20 text-primary font-bold"
              size="sm"
            />
            <div>
              <h3 className="font-bold text-sm leading-none">{currentCommunity?.name}</h3>
              <p className="text-[10px] text-default-400 mt-1">
                {currentCommunity?.total_members || 1} members
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
          {isChatLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner label="Loading conversation..." />
            </div>
          ) : chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-default-400 gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <MessageSquare size={24} />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">Welcome to the Community Chat</p>
                <p className="text-xs max-w-xs mt-1">Be the first to send a message, share photos, or post updates!</p>
              </div>
            </div>
          ) : (
            chatMessages.map((msg) => {
              const isOwn = msg.sender_id === user?.id
              
              if (msg.message_type === 'challenge') {
                const postForCard = {
                  id: msg.post_id,
                  username: msg.sender_username,
                  profile_photo: msg.sender_photo,
                  title: msg.post_title,
                  content: msg.post_content,
                  challenge_data: msg.challenge_data,
                  media: msg.post_media,
                  reply_count: msg.reply_count,
                  like_count: msg.like_count
                }
                
                return (
                  <div key={msg.id} className={`flex flex-col w-full my-2 ${isOwn ? 'items-end' : 'items-start'}`}>
                    <div className="w-[80%] max-w-[500px]">
                      <ChallengeCard 
                        post={postForCard} 
                        communityId={id as string} 
                        adminId={currentCommunity?.admin_id}
                        onUpdate={() => {
                          fetchCommunityPosts()
                          fetchChatMessages()
                        }} 
                      />
                    </div>
                  </div>
                )
              }
              
              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm border ${
                    isOwn 
                      ? 'bg-primary text-primary-foreground border-primary/20' 
                      : 'bg-content1 text-foreground border-divider'
                  }`}>
                    <div className="flex justify-between items-center mb-1.5 gap-4">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`font-bold text-xs ${isOwn ? 'text-primary-foreground/95' : 'text-primary'} truncate`}>
                          {isOwn ? 'You' : msg.sender_username}
                        </span>
                        {msg.sender_id === currentCommunity?.admin_id && (
                          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider shrink-0 ${
                            isOwn 
                              ? 'bg-white/25 text-white border border-white/40' 
                              : 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                          }`}>
                            Admin
                          </span>
                        )}
                      </div>
                      <span className={`text-[9px] shrink-0 ${isOwn ? 'text-primary-foreground/75' : 'text-default-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {msg.content && <p className="text-sm break-words leading-relaxed">{msg.content}</p>}
                    
                    {msg.media && msg.media.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {msg.media.map((url: string) => {
                          const fullUrl = `${BACKEND_URL}${url}`
                          const isImg = /\.(jpeg|jpg|gif|png|webp)$/i.test(url)
                          const isVid = /\.(mp4|3gp|ogg|webm|mov)$/i.test(url)
                          
                          if (isImg) {
                            return (
                              <img 
                                key={url} 
                                src={fullUrl} 
                                alt="Shared Image" 
                                className="max-w-full rounded-xl border border-divider/10 mt-2 max-h-60 object-cover cursor-pointer hover:opacity-90"
                                onClick={() => window.open(fullUrl, '_blank')}
                              />
                            )
                          } else if (isVid) {
                            return (
                              <video 
                                key={url} 
                                src={fullUrl} 
                                controls 
                                className="max-w-full rounded-xl border border-divider/10 mt-2 max-h-60 object-cover"
                              />
                            )
                          } else {
                            return (
                              <a 
                                key={url} 
                                href={fullUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs underline flex items-center gap-1 mt-2 text-primary font-medium"
                              >
                                View File
                              </a>
                            )
                          }
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
          <div ref={chatMessagesEndRef} />
        </div>

        {/* Chat Input Area */}
        <div className="p-4 border-t border-divider bg-content1 flex flex-col gap-2 shrink-0">
          {/* File Upload Preview bar */}
          {chatFilePreview && (
            <div className="flex items-center justify-between p-2.5 bg-default-50 rounded-xl border border-divider">
              <div className="flex items-center gap-3 min-w-0">
                {/\.(mp4|3gp|ogg|webm|mov)$/i.test(selectedChatFile?.name || '') ? (
                  <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                    Video
                  </div>
                ) : (
                  <img src={chatFilePreview} className="w-12 h-12 rounded-lg object-cover border border-divider shrink-0" alt="Preview" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate text-foreground">{selectedChatFile?.name}</p>
                  <p className="text-[10px] text-default-400">Ready to upload</p>
                </div>
              </div>
              <Button 
                size="sm" 
                isIconOnly 
                variant="light" 
                onClick={() => {
                  setSelectedChatFile(null)
                  setChatFilePreview(null)
                }}
              >
                ✕
              </Button>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 bg-default-100/50 rounded-xl px-4 py-2 flex items-center gap-3 border border-divider">
              <Dropdown placement="top-start">
                <DropdownTrigger>
                  <Button 
                    size="sm" 
                    isIconOnly 
                    variant="light" 
                    className="text-default-400 min-w-0 w-8 h-8"
                  >
                    <Paperclip size={18} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Attachment Options">
                  <DropdownItem 
                    key="documents" 
                    startContent={<FileText size={18} className="text-blue-500" />}
                    description="Send PDFs, Docs, etc."
                    isDisabled
                  >
                    Documents
                  </DropdownItem>
                  <DropdownItem 
                    key="images" 
                    startContent={<Image size={18} className="text-green-500" />}
                    description="Upload a photo"
                    onClick={() => document.getElementById('chat-file-upload')?.click()}
                  >
                    Images
                  </DropdownItem>
                  <DropdownItem 
                    key="videos" 
                    startContent={<Video size={18} className="text-purple-500" />}
                    description="Upload a video"
                    onClick={() => document.getElementById('chat-file-upload')?.click()}
                  >
                    Videos
                  </DropdownItem>
                  <DropdownItem 
                    key="challenge" 
                    startContent={<Trophy size={18} className="text-amber-500" />}
                    description="Post a challenge"
                    onClick={() => setIsChallengeModalOpen(true)}
                  >
                    Challenge
                  </DropdownItem>
                  <DropdownItem 
                    key="tasks" 
                    startContent={<CheckSquare size={18} className="text-rose-500" />}
                    description="Assign tasks"
                    isDisabled
                  >
                    Tasks
                  </DropdownItem>
                  <DropdownItem 
                    key="poll" 
                    startContent={<BarChart2 size={18} className="text-cyan-500" />}
                    description="Create a poll"
                    isDisabled
                  >
                    Poll
                  </DropdownItem>
                  <DropdownItem 
                    key="voice" 
                    startContent={<Mic size={18} className="text-orange-500" />}
                    description="Record voice note"
                    isDisabled
                  >
                    Voice Note
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
              <input 
                type="file" 
                id="chat-file-upload" 
                className="hidden" 
                accept="image/*,video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setSelectedChatFile(file)
                    setChatFilePreview(URL.createObjectURL(file))
                  }
                }}
              />
              <input
                placeholder={`Message in ${currentCommunity?.name}...`}
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendChatMessage()
                }}
                className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-default-400"
              />
              <Button size="sm" isIconOnly variant="light" className="text-default-400 min-w-0 w-8 h-8">
                <Smile size={18} />
              </Button>
            </div>
            <Button 
              color="primary" 
              onClick={handleSendChatMessage} 
              isLoading={isSendingChatMessage || isUploadingChatFile} 
              isDisabled={!chatInputText.trim() && !selectedChatFile}
              className="min-w-0 w-12 h-12 rounded-xl"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* COLUMN 3: RIGHT PANEL - Community Info & Posts */}
      {showRightPanel && (
        <div className="w-96 border-l border-divider flex flex-col bg-content1 shrink-0">
          {/* Info Header */}
          <div className="h-16 border-b border-divider px-4 flex items-center justify-between shrink-0">
            <h4 className="font-bold text-sm">Community Info</h4>
            <Button size="sm" variant="light" isIconOnly onClick={() => setShowRightPanel(false)}>
              ✕
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Logo, Name, Details */}
            <div className="flex flex-col items-center text-center pb-4 border-b border-divider gap-3">
              <Avatar
                src={currentCommunity?.icon ? `${BACKEND_URL}${currentCommunity.icon}` : undefined}
                name={currentCommunity?.name?.charAt(0).toUpperCase() || 'C'}
                className="w-24 h-24 text-3xl font-bold bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20"
              />
              <div>
                <h3 className="font-bold text-lg leading-tight">{currentCommunity?.name}</h3>
                {currentCommunity?.admin_id === user?.id && (
                  <Button 
                    size="sm" 
                    variant="light" 
                    className="h-7 text-xs text-primary font-semibold mt-1 px-3 bg-primary/10 hover:bg-primary/20 rounded-full"
                    startContent={<Edit size={12} />}
                    onClick={handleOpenEdit}
                  >
                    Edit Info
                  </Button>
                )}
                <div className="flex items-center justify-center gap-1 text-default-500 text-xs mt-2">
                  <Users size={14} />
                  <span>{currentCommunity?.total_members || 1} Members</span>
                </div>
              </div>
              {currentCommunity?.domain && (
                <Chip size="sm" color="secondary" variant="flat">
                  {currentCommunity.domain}
                </Chip>
              )}
            </div>

            {/* Description & Tags */}
            <div className="space-y-4 pb-4 border-b border-divider">
              <div>
                <h5 className="text-xs font-bold text-default-400 uppercase tracking-wider mb-1">Description</h5>
                <p className="text-sm text-default-600 leading-relaxed">
                  {currentCommunity?.description || 'No description provided for this community.'}
                </p>
              </div>

              {currentCommunity?.tags && currentCommunity.tags.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-default-400 uppercase tracking-wider mb-2">Tags</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {currentCommunity.tags.map((tag: string) => (
                      <Chip key={tag} size="sm" variant="flat" className="bg-default-100">
                        {tag}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Add Members Section */}
            {currentCommunity?.admin_id === user?.id && (
              <div className="pb-4 border-b border-divider">
                <Button 
                  className="w-full font-semibold bg-gradient-to-r from-primary to-secondary text-white shadow-sm hover:opacity-90"
                  color="primary"
                  startContent={<Plus size={16} />}
                  onClick={() => {
                    setSearchedMembers([])
                    setMemberSearchQuery('')
                    onAddOpen()
                    handleSearchMembers('ai')
                  }}
                >
                  Add Members
                </Button>
              </div>
            )}

            {/* Members List */}
            <div className="space-y-3 pb-4 border-b border-divider">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-default-400 uppercase tracking-wider">Members</h5>
                <span className="text-[11px] font-medium text-default-400">{currentCommunity?.members_details?.length || 0}</span>
              </div>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {currentCommunity?.members_details && currentCommunity.members_details.length > 0 ? (
                  [...currentCommunity.members_details]
                    .sort((a, b) => (a.id === currentCommunity.admin_id ? -1 : b.id === currentCommunity.admin_id ? 1 : 0))
                    .map((m: any) => {
                      const isAdmin = m.id === currentCommunity.admin_id
                      return (
                        <div key={m.id} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-default-50 transition-colors">
                          <Avatar 
                            src={m.profile_photo ? `${BACKEND_URL}${m.profile_photo}` : undefined} 
                            name={m.username?.charAt(0).toUpperCase()} 
                            size="sm"
                            className={isAdmin ? "bg-amber-500/20 text-amber-600 font-bold shrink-0 ring-2 ring-amber-500/30" : "bg-primary/10 text-primary font-semibold shrink-0"}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-xs truncate">
                                {m.first_name || m.last_name 
                                  ? `${m.first_name || ''} ${m.last_name || ''}`.trim()
                                  : m.username}
                              </p>
                              {isAdmin && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30 rounded-full shrink-0 uppercase tracking-wider">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-default-400 truncate">{m.bio || 'Student'}</p>
                          </div>
                        </div>
                      )
                    })
                ) : (
                  <p className="text-xs text-default-400 italic">No members in this community.</p>
                )}
              </div>
            </div>

            {/* Posts List & Create Post Button */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h5 className="text-xs font-bold text-default-400 uppercase tracking-wider">All Posts</h5>
                <Button 
                  size="sm" 
                  color="primary" 
                  variant="flat" 
                  startContent={<Plus size={14} />}
                  onClick={onOpen}
                >
                  Post
                </Button>
              </div>

              <div className="space-y-3 pb-6">
                {isPostsLoading ? (
                  <div className="text-center py-4">
                    <Spinner size="sm" />
                  </div>
                ) : posts.length === 0 ? (
                  <p className="text-center text-xs text-default-400 py-6 italic bg-default-50 rounded-xl">
                    No posts shared yet. Be the first!
                  </p>
                ) : (
                  posts.map((post) => (
                    post.post_type === 'challenge' ? (
                      <ChallengeCard 
                        key={post.id} 
                        post={post} 
                        communityId={id as string} 
                        adminId={currentCommunity?.admin_id}
                        onUpdate={() => {
                          fetchCommunityPosts()
                        }} 
                      />
                    ) : (
                      <Card key={post.id} className="border border-divider shadow-none">
                        <CardBody className="p-3 gap-2.5">
                          <div className="flex gap-2.5 items-center">
                            <Avatar name={post.username?.charAt(0).toUpperCase()} size="sm" className="bg-secondary/20 text-secondary" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-xs truncate leading-tight">{post.username}</p>
                                {(post.author_id === currentCommunity?.admin_id || post.user_id === currentCommunity?.admin_id) && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30 rounded-full shrink-0 uppercase tracking-wider">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <p className="text-[9px] text-default-400 leading-none mt-0.5">Post Feed</p>
                            </div>
                          </div>
                          <div>
                            {post.title && <h6 className="font-bold text-sm text-foreground mb-1 leading-snug">{post.title}</h6>}
                            <p className="text-xs text-default-600 break-words leading-relaxed">{post.content}</p>
                          </div>
                          <div className="flex gap-3 text-default-400 mt-0.5">
                            <span className="flex items-center gap-1 text-[10px]">
                              <Heart size={12} />
                              {post.like_count || 0}
                            </span>
                            <span className="flex items-center gap-1 text-[10px]">
                              <MessageSquare size={12} />
                              {post.reply_count || 0}
                            </span>
                          </div>
                        </CardBody>
                      </Card>
                    )
                  ))
                )}
              </div>
            </div>

            {/* Exit/Delete Community Actions */}
            {currentCommunity?.admin_id !== user?.id && currentCommunity?.members?.includes(user?.id) && (
              <div className="pt-4 border-t border-divider">
                <Button 
                  className="w-full font-semibold"
                  color="danger"
                  variant="flat"
                  onClick={handleLeaveCommunity}
                  isLoading={isLeaving}
                >
                  Exit Community
                </Button>
              </div>
            )}

            {currentCommunity?.admin_id === user?.id && (
              <div className="pt-4 border-t border-divider">
                <Button 
                  className="w-full font-semibold shadow-sm"
                  color="danger"
                  variant="solid"
                  onClick={handleDeleteCommunity}
                  isLoading={isDeleting}
                >
                  Delete Community
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE POST MODAL */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Create Community Post</ModalHeader>
              <ModalBody className="flex flex-col gap-4">
                <Input
                  label="Title (Optional)"
                  placeholder="Give your update a title..."
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                />
                <Textarea
                  label="Content"
                  placeholder="Share details, updates or resources with the group..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  isRequired
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onClick={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onClick={() => handleCreatePost(onClose)} isLoading={isCreatingPost}>
                  Publish
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* CHALLENGE MODAL */}
      <ChallengeModal 
        isOpen={isChallengeModalOpen} 
        onClose={() => setIsChallengeModalOpen(false)} 
        communityId={id as string} 
        onSuccess={() => fetchCommunityPosts()} 
      />

      {/* EDIT COMMUNITY MODAL */}
      <Modal isOpen={isEditOpen} onOpenChange={onEditOpenChange} placement="center" size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Edit Community Information</ModalHeader>
              <ModalBody className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group cursor-pointer" onClick={() => document.getElementById('community-logo-file')?.click()}>
                    <Avatar
                      src={logoPreviewUrl || undefined}
                      name={editName?.charAt(0).toUpperCase() || 'C'}
                      className="w-24 h-24 text-3xl font-bold bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload size={20} className="text-white" />
                    </div>
                  </div>
                  <input
                    type="file"
                    id="community-logo-file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setSelectedLogoFile(file)
                        setLogoPreviewUrl(URL.createObjectURL(file))
                      }
                    }}
                  />
                  <p className="text-[11px] text-default-400">Click avatar to upload community logo</p>
                </div>
                <Input
                  label="Community Name"
                  placeholder="e.g. Hackers Club"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  isRequired
                />
                <Input
                  label="Domain/Category"
                  placeholder="e.g. Technology, Art, Sports"
                  value={editDomain}
                  onChange={(e) => setEditDomain(e.target.value)}
                />
                <Input
                  label="Tags (Comma separated)"
                  placeholder="e.g. coding, webdev, react"
                  value={editTagsString}
                  onChange={(e) => setEditTagsString(e.target.value)}
                />
                <Textarea
                  label="Description"
                  placeholder="What is this community about..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onClick={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onClick={() => handleSaveCommunity(onClose)} isLoading={isSavingCommunity}>
                  Save Changes
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ADD MEMBERS MODAL */}
      <Modal isOpen={isAddOpen} onOpenChange={onAddOpenChange} placement="center" size="xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Add Members to Community</ModalHeader>
              <ModalBody className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name or interest domain..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearchMembers('manual')
                    }}
                    startContent={<Search size={16} className="text-default-400" />}
                    className="flex-1"
                  />
                  <Button 
                    color="primary"
                    onClick={() => handleSearchMembers('manual')}
                    isLoading={isSearchingMembers && searchMode === 'manual'}
                  >
                    Search
                  </Button>
                  <Button 
                    color="secondary"
                    variant="flat"
                    className="bg-secondary/10 font-medium"
                    startContent={<Sparkles size={16} />}
                    onClick={() => handleSearchMembers('ai')}
                    isLoading={isSearchingMembers && searchMode === 'ai'}
                  >
                    Find Member (AI)
                  </Button>
                </div>

                <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 mt-2">
                  {isSearchingMembers ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <Spinner color="primary" size="md" />
                      <p className="text-xs text-default-400">
                        {searchMode === 'ai' ? 'AI is analyzing student interests...' : 'Searching candidates...'}
                      </p>
                    </div>
                  ) : searchedMembers.length === 0 ? (
                    <div className="text-center py-10 text-sm text-default-400 italic">
                      No matching users found. Try changing the query or try AI matchmaking!
                    </div>
                  ) : (
                    searchedMembers.map((member) => (
                      <Card key={member.id} className="border border-divider shadow-none">
                        <CardBody className="p-3 flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar
                              src={member.profile_photo ? `${BACKEND_URL}${member.profile_photo}` : undefined}
                              name={member.username?.charAt(0).toUpperCase()}
                              className="bg-primary/10 text-primary font-semibold"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate leading-tight">
                                {member.first_name || member.last_name 
                                  ? `${member.first_name || ''} ${member.last_name || ''}`.trim()
                                  : member.username}
                              </p>
                              {member.reason && (
                                <p className="text-[10px] text-secondary font-medium mt-0.5 flex items-center gap-1">
                                  <Sparkles size={10} />
                                  {member.reason}
                                </p>
                              )}
                              {member.interests && member.interests.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {member.interests.slice(0, 3).map((interest: string) => (
                                    <Chip key={interest} size="sm" variant="flat" className="h-4 text-[9px] bg-default-50">
                                      {interest}
                                    </Chip>
                                  ))}
                                  {member.interests.length > 3 && (
                                    <span className="text-[8px] text-default-400">+{member.interests.length - 3} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            color={member.isInvited ? "success" : "primary"}
                            variant={member.isInvited ? "flat" : "solid"}
                            className="font-medium shrink-0"
                            startContent={member.isInvited ? <Check size={14} /> : <Plus size={14} />}
                            isDisabled={member.isInvited}
                            onClick={() => handleAddMember(member.id)}
                          >
                            {member.isInvited ? "Invited" : "Invite"}
                          </Button>
                        </CardBody>
                      </Card>
                    ))
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onClick={onClose}>
                  Done
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
