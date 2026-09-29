'use client'

import React, { useRef } from 'react'
import { Card, CardBody, Avatar, Chip, Button } from '@nextui-org/react'
import { Users, ChevronLeft, ChevronRight, Hash, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Community {
  id: number
  name: string
  slug: string
  description?: string
  icon?: string
  banner?: string
  domain?: string
  tags?: string[]
  total_members?: number
}

interface JoinedCommunitiesBarProps {
  communities: Community[]
  isOpen: boolean
  isLoading?: boolean
}

export default function JoinedCommunitiesBar({ communities, isOpen, isLoading }: JoinedCommunitiesBarProps) {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)

  if (!isOpen) return null

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <div className="mt-4 p-4 rounded-2xl bg-default-50 border border-divider/70 transition-all duration-300 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-default-500">Joined Communities</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {communities.length}
          </span>
        </div>
        {communities.length > 2 && (
          <div className="flex items-center gap-1">
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              radius="full"
              className="w-7 h-7 min-w-7 bg-background shadow-xs hover:bg-default-200"
              onClick={() => scroll('left')}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              radius="full"
              className="w-7 h-7 min-w-7 bg-background shadow-xs hover:bg-default-200"
              onClick={() => scroll('right')}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[240px] h-28 rounded-xl bg-default-200 animate-pulse" />
          ))}
        </div>
      ) : communities.length === 0 ? (
        <div className="py-6 text-center text-sm text-default-400">
          Not a member of any communities yet.
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {communities.map((community) => (
            <Card
              key={community.id}
              isPressable
              onClick={() => router.push(`/communities/${community.id}`)}
              className="min-w-[260px] max-w-[280px] shrink-0 snap-start border border-divider/60 bg-background shadow-xs hover:shadow-md hover:border-primary/50 transition-all rounded-xl overflow-hidden group text-left"
            >
              <CardBody className="p-3.5 flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Avatar
                    src={community.icon || undefined}
                    name={community.name.charAt(0).toUpperCase()}
                    className="w-10 h-10 shrink-0 font-bold bg-primary/10 text-primary rounded-xl"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {community.name}
                    </h4>
                    <p className="text-xs text-default-500 truncate flex items-center gap-1">
                      {community.domain ? (
                        <span className="font-medium text-default-600">{community.domain}</span>
                      ) : (
                        <span>Community</span>
                      )}
                    </p>
                  </div>
                  <ExternalLink size={14} className="text-default-400 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-divider/40 text-xs">
                  <div className="flex items-center gap-1.5 text-default-500">
                    <Users size={13} className="text-secondary" />
                    <span>{community.total_members || 1} members</span>
                  </div>

                  {community.tags && community.tags.length > 0 && (
                    <Chip size="sm" variant="flat" color="primary" className="text-[10px] h-5 max-w-[110px] truncate">
                      #{community.tags[0]}
                    </Chip>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
