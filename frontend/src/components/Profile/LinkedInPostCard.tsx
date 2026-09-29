'use client'

import React, { useState } from 'react'
import { Card, CardBody, Avatar, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react'
import { ThumbsUp, MessageSquare, Repeat2, Send, MoreHorizontal, Trash2, Globe, Play, BarChart2, Check } from 'lucide-react'

interface LinkedInPostCardProps {
  post: any
  currentUserId?: number
  onLike: (postId: number) => void
  onDelete?: (postId: number) => void
  backendUrl: string
}

export default function LinkedInPostCard({
  post,
  currentUserId,
  onLike,
  onDelete,
  backendUrl
}: LinkedInPostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const isAuthor = currentUserId && post.author_id === currentUserId
  const isLiked = Array.isArray(post.likes) && currentUserId ? post.likes.includes(currentUserId) : false

  const isVideoFile = (url: string) => {
    if (!url) return false
    const ext = url.split('.').pop()?.toLowerCase() || ''
    return ['mp4', 'webm', 'mov', 'm4v', 'ogg'].includes(ext)
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo`
    return `${Math.floor(diffInSeconds / 31536000)}y`
  }

  const hasMedia = post.media && post.media.length > 0
  const mediaUrl = hasMedia ? post.media[0] : null
  const isVideo = mediaUrl ? isVideoFile(mediaUrl) : false

  const contentText = post.content || ''
  const shouldTruncate = contentText.length > 140 && !isExpanded

  // Deterministic impressions based on post id and likes/replies
  const impressions = post.impressions || (post.id * 37 + (post.like_count || 0) * 12 + 42)

  return (
    <Card className="w-[340px] sm:w-[380px] shrink-0 snap-start border border-divider/60 bg-background shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden flex flex-col justify-between">
      <CardBody className="p-4 pb-2 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              src={post.profile_photo ? `${backendUrl}${post.profile_photo}` : undefined}
              name={post.username?.charAt(0).toUpperCase()}
              size="sm"
              className="w-10 h-10 ring-2 ring-primary/20 shrink-0 font-bold bg-primary/10 text-primary"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sm text-foreground truncate max-w-[150px]">
                  {post.first_name || post.username} {post.last_name || ''}
                </span>
                {isAuthor && (
                  <span className="text-[11px] text-default-400 font-medium">• You</span>
                )}
              </div>
              <p className="text-[11px] text-default-500 truncate max-w-[180px]">
                {post.headline || post.college_name || 'Member at SmartSync'}
              </p>
              <p className="text-[10px] text-default-400 flex items-center gap-1 mt-0.5">
                <span>{formatTimeAgo(post.created_at)}</span>
                <span>•</span>
                <Globe size={11} className="text-default-400 inline" />
              </p>
            </div>
          </div>

          {/* Options Menu */}
          {isAuthor && onDelete && (
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light" className="w-8 h-8 min-w-8 text-default-400 hover:text-foreground">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Post actions">
                <DropdownItem
                  key="delete"
                  color="danger"
                  className="text-danger"
                  startContent={<Trash2 size={14} />}
                  onClick={() => onDelete(post.id)}
                >
                  Delete Post
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          )}
        </div>

        {/* Post Text */}
        {contentText && (
          <div className="text-xs text-foreground/90 leading-relaxed">
            <span className="whitespace-pre-wrap">
              {shouldTruncate ? `${contentText.slice(0, 140)}... ` : contentText}
            </span>
            {contentText.length > 140 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-primary text-xs font-semibold hover:underline ml-1"
              >
                {isExpanded ? 'less' : 'more'}
              </button>
            )}
          </div>
        )}

        {/* Media Container */}
        {hasMedia && mediaUrl && (
          <div className="relative rounded-xl overflow-hidden bg-black/90 aspect-4/3 flex items-center justify-center border border-divider/40 group/media">
            {isVideo ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  src={`${backendUrl}${mediaUrl}`}
                  controls
                  className="w-full h-full object-contain"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              </div>
            ) : (
              <img
                src={`${backendUrl}${mediaUrl}`}
                alt="Post content"
                className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-300"
              />
            )}
          </div>
        )}

        {/* Interaction Metrics (Like badges + count) */}
        <div className="flex items-center justify-between pt-2 border-t border-divider/40 text-[11px] text-default-500">
          <div className="flex items-center gap-1.5">
            {(post.like_count > 0 || isLiked) && (
              <div className="flex items-center -space-x-1">
                <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-white shadow-xs">
                  <ThumbsUp size={9} className="fill-white" />
                </span>
              </div>
            )}
            <span>{(post.like_count || 0) + (isLiked && !post.like_count ? 1 : 0)}</span>
          </div>

          <div className="flex items-center gap-3">
            <span>{post.reply_count || 0} comments</span>
          </div>
        </div>

        {/* Action Buttons (ThumbsUp, Message, Repost, Send) */}
        <div className="grid grid-cols-4 gap-1 py-1 border-t border-divider/40">
          <Button
            size="sm"
            variant="light"
            onClick={() => onLike(post.id)}
            className={`min-w-0 px-1.5 h-8 gap-1.5 text-xs font-medium ${
              isLiked ? 'text-primary font-bold bg-primary/10' : 'text-default-600'
            }`}
          >
            <ThumbsUp size={14} className={isLiked ? 'fill-primary' : ''} />
            <span className="hidden sm:inline">Like</span>
          </Button>

          <Button
            size="sm"
            variant="light"
            className="min-w-0 px-1.5 h-8 gap-1.5 text-xs text-default-600"
          >
            <MessageSquare size={14} />
            <span className="hidden sm:inline">Comment</span>
          </Button>

          <Button
            size="sm"
            variant="light"
            className="min-w-0 px-1.5 h-8 gap-1.5 text-xs text-default-600"
          >
            <Repeat2 size={14} />
            <span className="hidden sm:inline">Repost</span>
          </Button>

          <Button
            size="sm"
            variant="light"
            className="min-w-0 px-1.5 h-8 gap-1.5 text-xs text-default-600"
          >
            <Send size={14} />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </div>
      </CardBody>

      {/* Analytics Footer (LinkedIn style) */}
      <div className="px-4 py-2.5 bg-default-100/50 border-t border-divider/40 flex items-center justify-between text-[11px] text-default-600">
        <div className="flex items-center gap-1.5 font-medium">
          <BarChart2 size={13} className="text-default-500" />
          <span>{impressions} impressions</span>
        </div>
        <span className="text-primary font-semibold hover:underline cursor-pointer">
          View analytics
        </span>
      </div>
    </Card>
  )
}
