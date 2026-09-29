'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardBody, Avatar, Button, ButtonGroup, Divider, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react'
import { Users, Compass, UserPlus, UserMinus, ShieldOff, Unlock, ChevronDown, Check, X, Hourglass, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/store/authSlice'
import api from '@/lib/api'
import JoinedCommunitiesBar from '@/components/Profile/JoinedCommunitiesBar'
import SolutionsSlideBar from '@/components/Profile/SolutionsSlideBar'
import PostsSlideBar from '@/components/Profile/PostsSlideBar'

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '')

export default function UserProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuthStore()

  const [profile, setProfile] = useState<any>(null)
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [userSolutions, setUserSolutions] = useState<any[]>([])
  const [userCommunities, setUserCommunities] = useState<any[]>([])
  const [isCommunitiesOpen, setIsCommunitiesOpen] = useState(false)
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [blockedState, setBlockedState] = useState<{ isBlocked: boolean; username: string; message: string } | null>(null)

  useEffect(() => {
    // If viewing own profile, redirect to /profile/me
    if (user?.id && id && parseInt(id as string) === user.id) {
      router.replace('/profile/me')
      return
    }

    const fetchProfileAndData = async () => {
      if (!id) return
      try {
        const [profileRes, postsRes, solutionsRes, communitiesRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get(`/posts/user/${id}`).catch(() => ({ data: [] })),
          api.get(`/users/${id}/solutions`).catch(() => ({ data: [] })),
          api.get(`/users/${id}/communities`).catch(() => ({ data: [] }))
        ])
        setProfile(profileRes.data)
        setUserPosts(postsRes.data || [])
        setUserSolutions(solutionsRes.data || [])
        setUserCommunities(communitiesRes.data || [])
      } catch (error: any) {
        if (error.response?.status === 403 && error.response?.data?.isBlocked) {
          setBlockedState({
            isBlocked: true,
            username: error.response.data.username || 'User',
            message: error.response.data.message || 'User blocked you'
          })
        } else {
          console.error('Failed to fetch profile or user data', error)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileAndData()
  }, [id, user, router])

  const handleConnect = async () => {
    try {
      setIsActionLoading(true)
      await api.post('/connections/request', { to_user_id: id })
      setProfile((prev: any) => ({ ...prev, connectionStatus: 'pending_sent' }))
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to send connection request.')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleAcceptRequest = async () => {
    if (!profile?.connectionRequestId) return
    try {
      setIsActionLoading(true)
      await api.post(`/connections/request/${profile.connectionRequestId}/accept`)
      setProfile((prev: any) => ({ ...prev, connectionStatus: 'connected' }))
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to accept connection request.')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeclineRequest = async () => {
    if (!profile?.connectionRequestId) return
    try {
      setIsActionLoading(true)
      await api.post(`/connections/request/${profile.connectionRequestId}/decline`)
      setProfile((prev: any) => ({ ...prev, connectionStatus: 'none', connectionRequestId: null }))
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to decline connection request.')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!id) return
    if (!window.confirm('Are you sure you want to disconnect from this user?')) return
    try {
      setIsActionLoading(true)
      await api.post(`/connections/disconnect/${id}`)
      setProfile((prev: any) => ({ ...prev, connectionStatus: 'none', connectionRequestId: null }))
      alert('Disconnected successfully.')
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to disconnect.')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleBlock = async () => {
    if (!id) return
    if (!window.confirm('Are you sure you want to block this user? They will not be able to view your profile, message you, or send connection requests.')) return
    try {
      setIsActionLoading(true)
      await api.post(`/connections/block/${id}`)
      setProfile((prev: any) => ({ ...prev, connectionStatus: 'blocked_by_me', connectionRequestId: null }))
      alert('User blocked.')
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to block user.')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleUnblock = async () => {
    if (!id) return
    try {
      setIsActionLoading(true)
      await api.post(`/connections/unblock/${id}`)
      setProfile((prev: any) => ({ ...prev, connectionStatus: 'none' }))
      alert('User unblocked.')
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to unblock user.')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleLikePost = async (postId: number) => {
    try {
      const res = await api.post(`/posts/${postId}/like`)
      setUserPosts(prev => prev.map(p => p.id === postId ? { ...p, ...res.data.post } : p))
    } catch (error: any) {
      console.error('Error liking post:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse flex flex-col gap-6 max-w-5xl mx-auto py-4">
        <div className="h-56 bg-default-200 rounded-3xl"></div>
        <div className="h-64 bg-default-100 rounded-3xl mt-6"></div>
      </div>
    )
  }

  if (blockedState?.isBlocked) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4 flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-danger-50 text-danger flex items-center justify-center border border-danger-200 shadow-sm">
          <ShieldOff size={40} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-default-900">
            {blockedState.username} blocked you
          </h2>
          <p className="text-default-500 text-sm mt-2 leading-relaxed">
            You cannot view @{blockedState.username}&apos;s profile or send connection requests until unblocked.
          </p>
        </div>
        <Button color="primary" variant="flat" onClick={() => router.push('/dashboard')} className="mt-2 font-semibold">
          Go to Dashboard
        </Button>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold">User Not Found</h2>
        <p className="text-default-500 mt-2">The user you are trying to view does not exist or has been deleted.</p>
        <Button className="mt-4" color="primary" variant="flat" onClick={() => router.push('/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    )
  }

  const connectionsCount = profile?.friends?.length || 0
  const communitiesCount = profile?.joined_communities?.length || userCommunities.length

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-16">
      {/* Back navigation */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="light" isIconOnly radius="full" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <span className="text-sm font-medium text-default-500">Back</span>
      </div>

      {/* Cover Image & Basic Info Card */}
      <Card className="overflow-visible border border-divider/60 shadow-xs bg-background rounded-3xl">
        <div className="h-48 sm:h-56 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-t-3xl relative">
          {/* Avatar Container */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 absolute -bottom-14 sm:-bottom-16 left-6 sm:left-8 rounded-full border-4 border-background bg-background shadow-lg overflow-hidden flex items-center justify-center">
            <Avatar 
              src={profile.profile_photo ? `${BACKEND_URL}${profile.profile_photo}` : undefined} 
              name={profile.username?.charAt(0).toUpperCase()}
              className="w-full h-full text-3xl sm:text-4xl font-bold"
              color="primary"
            />
          </div>
        </div>

        <CardBody className="pt-18 sm:pt-20 px-6 sm:px-8 pb-8 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {profile.first_name} {profile.last_name}
              </h1>
              <p className="text-sm font-medium text-default-500">@{profile.username}</p>
              
              {/* Bio */}
              <div className="mt-3 max-w-2xl">
                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                  {profile.bio || 'No bio provided yet.'}
                </p>
              </div>

              {/* LinkedIn Style Connections & Communities Bar */}
              <div className="mt-4 flex items-center flex-wrap gap-4 text-sm font-medium pt-1">
                {/* 1. Connections Count */}
                <div className="flex items-center gap-1.5 text-primary font-semibold">
                  <Users size={16} className="text-primary" />
                  <span>
                    {connectionsCount} {connectionsCount === 1 ? 'connection' : 'connections'}
                  </span>
                </div>

                <span className="text-default-300">•</span>

                {/* 2. Communities Count with Downward Arrow */}
                <button
                  onClick={() => setIsCommunitiesOpen(!isCommunitiesOpen)}
                  className="group flex items-center gap-1.5 text-foreground hover:text-primary transition-colors font-semibold"
                  title="Click to view joined communities"
                >
                  <Compass size={16} className="text-secondary group-hover:rotate-45 transition-transform" />
                  <span className="underline decoration-default-300 underline-offset-4 group-hover:decoration-primary">
                    {communitiesCount} {communitiesCount === 1 ? 'community' : 'communities'}
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={`text-default-400 group-hover:text-primary transition-transform duration-200 ${
                      isCommunitiesOpen ? 'rotate-180 text-primary' : ''
                    }`} 
                  />
                </button>
              </div>

              {/* Expandable Joined Communities Horizontal Ribbon */}
              <JoinedCommunitiesBar 
                communities={userCommunities} 
                isOpen={isCommunitiesOpen} 
                isLoading={isLoadingCommunities} 
              />
            </div>
            
            {/* Action Buttons depending on Connection Status */}
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              {profile.connectionStatus === 'none' && (
                <ButtonGroup color="primary" variant="solid" className="shadow-xs">
                  <Button 
                    startContent={<UserPlus size={16} />}
                    onClick={handleConnect}
                    isLoading={isActionLoading}
                    className="font-semibold"
                    radius="full"
                  >
                    Connect
                  </Button>
                  <Dropdown placement="bottom-end">
                    <DropdownTrigger>
                      <Button isIconOnly className="px-1 min-w-8" radius="full">
                        <ChevronDown size={16} />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Connect options">
                      <DropdownItem 
                        key="block" 
                        startContent={<ShieldOff size={16} className="text-danger" />}
                        description="Block user from connecting"
                        color="danger"
                        className="text-danger"
                        onClick={handleBlock}
                      >
                        Block
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </ButtonGroup>
              )}

              {profile.connectionStatus === 'pending_sent' && (
                <ButtonGroup color="warning" variant="flat">
                  <Button startContent={<Hourglass size={16} />} isDisabled className="font-semibold" radius="full">
                    Pending Approval
                  </Button>
                  <Dropdown placement="bottom-end">
                    <DropdownTrigger>
                      <Button isIconOnly className="px-1 min-w-8" radius="full">
                        <ChevronDown size={16} />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Pending options">
                      <DropdownItem 
                        key="block" 
                        startContent={<ShieldOff size={16} className="text-danger" />}
                        description="Block user from connecting"
                        color="danger"
                        className="text-danger"
                        onClick={handleBlock}
                      >
                        Block
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </ButtonGroup>
              )}

              {profile.connectionStatus === 'pending_received' && (
                <div className="flex gap-2">
                  <Button 
                    color="success" 
                    variant="solid" 
                    startContent={<Check size={16} />}
                    onClick={handleAcceptRequest}
                    isLoading={isActionLoading}
                    className="text-white font-semibold shadow-xs"
                    radius="full"
                  >
                    Accept
                  </Button>
                  <ButtonGroup color="danger" variant="flat">
                    <Button 
                      startContent={<X size={16} />}
                      onClick={handleDeclineRequest}
                      isLoading={isActionLoading}
                      className="font-semibold"
                      radius="full"
                    >
                      Decline
                    </Button>
                    <Dropdown placement="bottom-end">
                      <DropdownTrigger>
                        <Button isIconOnly className="px-1 min-w-8" radius="full">
                          <ChevronDown size={16} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Decline options">
                        <DropdownItem 
                          key="block" 
                          startContent={<ShieldOff size={16} className="text-danger" />}
                          description="Block user"
                          color="danger"
                          className="text-danger"
                          onClick={handleBlock}
                        >
                          Block
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </ButtonGroup>
                </div>
              )}

              {profile.connectionStatus === 'connected' && (
                <div className="flex gap-2">
                  <ButtonGroup color="success" variant="flat">
                    <Button startContent={<Check size={16} />} className="font-semibold cursor-default" radius="full">
                      Connected
                    </Button>
                    <Dropdown placement="bottom-end">
                      <DropdownTrigger>
                        <Button isIconOnly className="px-1 min-w-8" radius="full">
                          <ChevronDown size={16} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Connection options">
                        <DropdownItem 
                          key="disconnect" 
                          startContent={<UserMinus size={16} className="text-warning-600" />}
                          description="Remove from your connections list"
                          onClick={handleDisconnect}
                          className="text-warning-700 font-medium"
                        >
                          Disconnect
                        </DropdownItem>
                        <DropdownItem 
                          key="block" 
                          startContent={<ShieldOff size={16} className="text-danger" />}
                          description="Block user from messaging or reconnecting"
                          color="danger"
                          className="text-danger font-medium"
                          onClick={handleBlock}
                        >
                          Block
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </ButtonGroup>
                </div>
              )}

              {profile.connectionStatus === 'blocked_by_me' && (
                <Button 
                  color="danger" 
                  variant="flat" 
                  startContent={<Unlock size={16} />}
                  onClick={handleUnblock}
                  isLoading={isActionLoading}
                  className="font-semibold"
                  radius="full"
                >
                  Unblock
                </Button>
              )}
            </div>
          </div>
          
          <Divider className="my-3 opacity-60" />
          
          {/* Branch, Division & Interests */}
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap gap-8">
              <div className="flex flex-col">
                <span className="text-xs text-default-400 uppercase font-bold tracking-wider">Branch / College</span>
                <span className="text-sm font-semibold text-foreground mt-0.5">{profile.college_name || 'Not specified'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-default-400 uppercase font-bold tracking-wider">Division</span>
                <span className="text-sm font-semibold text-foreground mt-0.5">{profile.division || 'Not specified'}</span>
              </div>
            </div>

            {profile.interests?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-default-400 font-bold uppercase tracking-wider mr-1">Interests:</span>
                {profile.interests.map((interest: string) => (
                  <Chip key={interest} size="sm" color="primary" variant="flat" className="text-xs">
                    {interest}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* 3. SOLUTIONS SLIDER SECTION */}
      <SolutionsSlideBar 
        solutions={userSolutions} 
        isLoading={isLoading} 
        backendUrl={BACKEND_URL} 
        isOwnProfile={false} 
        userProfile={profile}
      />

      {/* 4. LINKEDIN-STYLE POSTS HORIZONTAL SLIDESHOW */}
      <PostsSlideBar 
        posts={userPosts} 
        currentUserId={user?.id} 
        onLike={handleLikePost} 
        backendUrl={BACKEND_URL} 
        isOwnProfile={false} 
      />
    </div>
  )
}
