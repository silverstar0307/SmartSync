'use client'

import React, { useRef, useState } from 'react'
import { Card, CardBody, Button } from '@nextui-org/react'
import { Sparkles, ChevronLeft, ChevronRight, Image as ImageIcon, ArrowRight, LayoutGrid, Rows } from 'lucide-react'
import LinkedInPostCard from './LinkedInPostCard'

interface PostsSlideBarProps {
  posts: any[]
  currentUserId?: number
  onLike: (postId: number) => void
  onDelete?: (postId: number) => void
  backendUrl: string
  isOwnProfile?: boolean
}

export default function PostsSlideBar({
  posts,
  currentUserId,
  onLike,
  onDelete,
  backendUrl,
  isOwnProfile
}: PostsSlideBarProps) {
  const [viewMode, setViewMode] = useState<'slider' | 'grid'>('slider')
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header with Navigation Controls & View Toggle */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              Posts
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {posts.length} Total
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {posts.length > 2 && viewMode === 'slider' && (
            <div className="flex items-center gap-1.5">
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                radius="full"
                className="w-8 h-8 min-w-8 bg-background border border-divider shadow-xs hover:bg-default-200"
                onClick={() => scroll('left')}
              >
                <ChevronLeft size={18} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                radius="full"
                className="w-8 h-8 min-w-8 bg-background border border-divider shadow-xs hover:bg-default-200"
                onClick={() => scroll('right')}
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          )}

          {posts.length > 1 && (
            <Button
              size="sm"
              variant="flat"
              className="text-xs font-medium h-8"
              startContent={viewMode === 'slider' ? <LayoutGrid size={14} /> : <Rows size={14} />}
              onClick={() => setViewMode(viewMode === 'slider' ? 'grid' : 'slider')}
            >
              {viewMode === 'slider' ? 'Grid View' : 'Slider View'}
            </Button>
          )}
        </div>
      </div>

      {posts.length === 0 ? (
        <Card className="shadow-xs border border-divider/60 bg-background">
          <CardBody className="p-8 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <ImageIcon size={28} />
            </div>
            <div>
              <h4 className="font-bold text-sm">No posts yet</h4>
              <p className="text-default-400 text-xs mt-1 max-w-sm">
                {isOwnProfile
                  ? 'Share your thoughts, achievements, campus projects, images, or videos with your network!'
                  : 'This user has not posted any updates yet.'}
              </p>
            </div>
          </CardBody>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <div key={post.id} className="w-full">
              <LinkedInPostCard
                post={post}
                currentUserId={currentUserId}
                onLike={onLike}
                onDelete={onDelete}
                backendUrl={backendUrl}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative group/container">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {posts.map((post) => (
              <LinkedInPostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onLike={onLike}
                onDelete={onDelete}
                backendUrl={backendUrl}
              />
            ))}
          </div>

          {/* Right Floating Arrow Button (as shown in LinkedIn screenshot) */}
          {posts.length > 1 && (
            <Button
              isIconOnly
              size="md"
              radius="full"
              variant="solid"
              color="default"
              className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 shadow-lg bg-background/95 backdrop-blur-md border border-divider hover:scale-105 hover:bg-default-100 transition-all cursor-pointer"
              onClick={() => scroll('right')}
            >
              <ChevronRight size={20} className="text-foreground" />
            </Button>
          )}

          {/* Show All Bottom Button (LinkedIn style) */}
          {posts.length > 2 && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setViewMode('grid')}
                className="text-xs font-semibold text-primary hover:text-primary-600 flex items-center gap-1.5 px-4 py-2 rounded-full hover:bg-primary/5 transition-colors"
              >
                Show all <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
