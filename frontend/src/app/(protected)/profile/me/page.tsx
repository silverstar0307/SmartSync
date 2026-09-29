'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardBody, Avatar, Button, Divider, Chip, Spinner, Textarea } from '@nextui-org/react'
import { Edit2, Users, FileText, Compass, Camera, Image as ImageIcon, Send, X, ChevronDown, Award, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/authSlice'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'
import JoinedCommunitiesBar from '@/components/Profile/JoinedCommunitiesBar'
import SolutionsSlideBar from '@/components/Profile/SolutionsSlideBar'
import PostsSlideBar from '@/components/Profile/PostsSlideBar'

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '')

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [userSolutions, setUserSolutions] = useState<any[]>([])
  const [userCommunities, setUserCommunities] = useState<any[]>([])
  const [isCommunitiesOpen, setIsCommunitiesOpen] = useState(false)
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  
  // Post creation state
  const [postContent, setPostContent] = useState('')
  const [postMediaFile, setPostMediaFile] = useState<File | null>(null)
  const [postMediaPreview, setPostMediaPreview] = useState<{ url: string; type: 'image' | 'video' } | null>(null)
  const [isSubmittingPost, setIsSubmittingPost] = useState(false)
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const fetchProfileAndData = async () => {
      if (!user?.id) return
      
      try {
        const [profileRes, postsRes, solutionsRes, communitiesRes] = await Promise.all([
          api.get(`/users/${user.id}`),
          api.get(`/posts/user/${user.id}`),
          api.get(`/users/${user.id}/solutions`).catch(() => ({ data: [] })),
          api.get(`/users/${user.id}/communities`).catch(() => ({ data: [] }))
        ])
        setProfile(profileRes.data)
        setUserPosts(postsRes.data || [])
        setUserSolutions(solutionsRes.data || [])
        setUserCommunities(communitiesRes.data || [])
      } catch (error) {
        console.error('Failed to fetch profile or user data', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileAndData()
  }, [user])

  const handlePhotoUpload = async (file: File) => {
    if (!user?.id) return
    setIsUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('profile_photo', file)
      const res = await api.post(`/users/${user.id}/profile-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const newPhoto = res.data.profile_photo
      setProfile((prev: any) => ({ ...prev, profile_photo: newPhoto }))
      updateUser({ profile_photo: newPhoto })
    } catch (e) {
      console.error('Error uploading profile photo:', e)
      alert('Failed to upload profile photo.')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isVideo = file.type.startsWith('video/')
    const previewUrl = URL.createObjectURL(file)
    setPostMediaFile(file)
    setPostMediaPreview({ url: previewUrl, type: isVideo ? 'video' : 'image' })
  }

  const handleCreatePost = async () => {
    if (!postContent.trim() && !postMediaFile) return
    setIsSubmittingPost(true)

    try {
      let mediaUrls: string[] = []

      if (postMediaFile) {
        setIsUploadingMedia(true)
        const formData = new FormData()
        formData.append('file', postMediaFile)
        const uploadRes = await api.post('/posts/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        mediaUrls.push(uploadRes.data.fileUrl)
        setIsUploadingMedia(false)
      }

      const res = await api.post('/posts', {
        content: postContent.trim(),
        media: mediaUrls
      })

      // Add new post to top of list
      setUserPosts(prev => [res.data, ...prev])
      setProfile((prev: any) => ({ ...prev, total_posts: (prev?.total_posts || 0) + 1 }))
      
      // Reset form
      setPostContent('')
      setPostMediaFile(null)
      setPostMediaPreview(null)
    } catch (error: any) {
      console.error('Failed to create post:', error)
      alert(error.response?.data?.message || 'Failed to create post.')
    } finally {
      setIsSubmittingPost(false)
      setIsUploadingMedia(false)
    }
  }

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      await api.delete(`/posts/${postId}`)
      setUserPosts(prev => prev.filter(p => p.id !== postId))
      setProfile((prev: any) => ({ ...prev, total_posts: Math.max(0, (prev?.total_posts || 1) - 1) }))
    } catch (error: any) {
      console.error('Failed to delete post:', error)
      alert('Failed to delete post.')
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

  const connectionsCount = profile?.friends?.length || 0
  const communitiesCount = profile?.joined_communities?.length || userCommunities.length

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-16">
      {/* Cover Image & Basic Info Card */}
      <Card className="overflow-visible border border-divider/60 shadow-xs bg-background rounded-3xl">
        <div className="h-48 sm:h-56 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-t-3xl relative">
          {/* Avatar Container with Hover & Camera Overlay */}
          <div 
            className="w-28 h-28 sm:w-32 sm:h-32 absolute -bottom-14 sm:-bottom-16 left-6 sm:left-8 rounded-full border-4 border-background bg-background shadow-lg group cursor-pointer overflow-hidden flex items-center justify-center"
            onClick={() => document.getElementById('quick-profile-photo-input')?.click()}
            title="Click to change profile photo"
          >
            <Avatar 
              src={profile?.profile_photo ? `${BACKEND_URL}${profile.profile_photo}` : undefined} 
              name={profile?.username?.charAt(0).toUpperCase()}
              className="w-full h-full text-3xl sm:text-4xl font-bold"
              color="primary"
            />
            {isUploadingPhoto ? (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Spinner size="sm" color="white" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={22} className="text-white mb-0.5" />
                <span className="text-[10px] text-white font-medium">Edit</span>
              </div>
            )}
          </div>

          <input
            type="file"
            id="quick-profile-photo-input"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                handlePhotoUpload(file)
              }
            }}
          />
        </div>

        <CardBody className="pt-18 sm:pt-20 px-6 sm:px-8 pb-8 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {profile?.first_name} {profile?.last_name}
              </h1>
              <p className="text-sm font-medium text-default-500">@{profile?.username}</p>
              
              {/* Bio */}
              <div className="mt-3 max-w-2xl">
                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                  {profile?.bio || 'No bio provided yet.'}
                </p>
              </div>

              {/* LinkedIn Style Connections & Communities Bar */}
              <div className="mt-4 flex items-center flex-wrap gap-4 text-sm font-medium pt-1">
                {/* 1. Connections Count (LinkedIn style) */}
                <button 
                  onClick={() => router.push('/connections')}
                  className="group flex items-center gap-1.5 text-primary hover:text-primary-600 transition-colors font-semibold"
                  title="View your connections"
                >
                  <Users size={16} className="text-primary group-hover:scale-110 transition-transform" />
                  <span className="underline decoration-primary/40 underline-offset-4 group-hover:decoration-primary">
                    {connectionsCount} {connectionsCount === 1 ? 'connection' : 'connections'}
                  </span>
                </button>

                <span className="text-default-300">•</span>

                {/* 2. Communities Count with Downward Arrow (Interactive) */}
                <button
                  onClick={() => setIsCommunitiesOpen(!isCommunitiesOpen)}
                  className="group flex items-center gap-1.5 text-foreground hover:text-primary transition-colors font-semibold"
                  title="Click to view your joined communities"
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
            
            <Button 
              color="primary" 
              variant="flat" 
              radius="full"
              className="font-semibold shadow-xs hover:shadow-sm"
              startContent={<Edit2 size={16} />}
              onClick={() => router.push('/profile/me/edit')}
            >
              Edit Profile
            </Button>
          </div>
          
          <Divider className="my-3 opacity-60" />
          
          {/* Branch, Division & Interests */}
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap gap-8">
              <div className="flex flex-col">
                <span className="text-xs text-default-400 uppercase font-bold tracking-wider">Branch / College</span>
                <span className="text-sm font-semibold text-foreground mt-0.5">{profile?.college_name || 'Not specified'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-default-400 uppercase font-bold tracking-wider">Division</span>
                <span className="text-sm font-semibold text-foreground mt-0.5">{profile?.division || 'Not specified'}</span>
              </div>
            </div>

            {profile?.interests?.length > 0 && (
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

      {/* CREATE POST CARD */}
      <Card className="shadow-xs border border-divider/60 bg-background rounded-2xl">
        <CardBody className="p-5 flex flex-col gap-4">
          <div className="flex gap-3">
            <Avatar 
              src={profile?.profile_photo ? `${BACKEND_URL}${profile.profile_photo}` : undefined} 
              name={profile?.username?.charAt(0).toUpperCase()}
              size="md"
              color="primary"
              className="font-bold shrink-0"
            />
            <Textarea
              placeholder="Share an update, achievement, project, photo or video with your network..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              minRows={2}
              variant="bordered"
              radius="lg"
              classNames={{
                inputWrapper: "border-default-200 hover:border-primary focus-within:border-primary"
              }}
            />
          </div>

          {/* Media Preview */}
          {postMediaPreview && (
            <div className="relative rounded-2xl overflow-hidden max-h-72 bg-black/5 flex items-center justify-center border border-divider">
              {postMediaPreview.type === 'image' ? (
                <img src={postMediaPreview.url} alt="Upload preview" className="max-h-72 object-contain w-full" />
              ) : (
                <video src={postMediaPreview.url} controls className="max-h-72 w-full object-contain bg-black" />
              )}
              <Button 
                isIconOnly 
                size="sm" 
                color="danger" 
                variant="solid" 
                radius="full"
                className="absolute top-2 right-2 shadow-md"
                onClick={() => {
                  setPostMediaFile(null)
                  setPostMediaPreview(null)
                }}
              >
                <X size={16} />
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-divider/40">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="flat"
                color="secondary"
                radius="full"
                startContent={<ImageIcon size={16} />}
                onClick={() => document.getElementById('post-media-input')?.click()}
              >
                Photo / Video
              </Button>
              <input
                type="file"
                id="post-media-input"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleMediaSelect}
              />
            </div>

            <Button
              color="primary"
              size="sm"
              radius="full"
              className="font-semibold px-6 shadow-xs"
              startContent={<Send size={14} />}
              isLoading={isSubmittingPost || isUploadingMedia}
              onClick={handleCreatePost}
              isDisabled={!postContent.trim() && !postMediaFile}
            >
              Post
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* 3. SOLUTIONS SLIDER SECTION */}
      <SolutionsSlideBar 
        solutions={userSolutions} 
        isLoading={isLoading} 
        backendUrl={BACKEND_URL} 
        isOwnProfile={true} 
        userProfile={profile}
      />

      {/* 4. LINKEDIN-STYLE POSTS HORIZONTAL SLIDESHOW */}
      <PostsSlideBar 
        posts={userPosts} 
        currentUserId={user?.id} 
        onLike={handleLikePost} 
        onDelete={handleDeletePost} 
        backendUrl={BACKEND_URL} 
        isOwnProfile={true} 
      />
    </div>
  )
}
