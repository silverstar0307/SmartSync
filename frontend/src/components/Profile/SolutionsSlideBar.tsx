'use client'

import React, { useRef, useState } from 'react'
import { Card, CardBody, Button, Chip, Avatar } from '@nextui-org/react'
import { Award, ChevronLeft, ChevronRight, FileText, Link as LinkIcon, Download, ExternalLink, CheckCircle2, Video, Image as ImageIcon, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import SolutionReportModal, { SolutionItem } from './SolutionReportModal'

interface SolutionsSlideBarProps {
  solutions: SolutionItem[]
  isLoading?: boolean
  backendUrl: string
  isOwnProfile?: boolean
  userProfile?: {
    first_name?: string
    last_name?: string
    username?: string
    college_name?: string
    division?: string
  }
}

export default function SolutionsSlideBar({
  solutions,
  isLoading,
  backendUrl,
  isOwnProfile,
  userProfile
}: SolutionsSlideBarProps) {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isReportOpen, setIsReportOpen] = useState(false)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const renderSolutionPreview = (solution: SolutionItem) => {
    const type = solution.solution_challenge_data?.type || 'TEXT'
    const media = solution.solution_media && solution.solution_media.length > 0
      ? `${backendUrl}${solution.solution_media[0]}`
      : null

    switch (type) {
      case 'IMAGE':
        return media ? (
          <div className="rounded-xl overflow-hidden bg-black/5 border border-divider/40 max-h-48 flex items-center justify-center">
            <img src={media} alt="Solution preview" className="w-full h-44 object-cover" />
          </div>
        ) : (
          <p className="text-xs text-default-400 italic">No image file attached</p>
        )
      case 'VIDEO':
        return media ? (
          <div className="rounded-xl overflow-hidden bg-black max-h-48 flex items-center justify-center">
            <video src={media} controls className="w-full h-44 object-contain" />
          </div>
        ) : (
          <p className="text-xs text-default-400 italic">No video file attached</p>
        )
      case 'PDF':
      case 'FILE':
        return media ? (
          <a
            href={media}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 p-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-medium text-xs transition-colors"
          >
            <FileText size={18} className="shrink-0" />
            <span className="truncate flex-1">View Attached Solution Document</span>
            <Download size={14} className="shrink-0" />
          </a>
        ) : (
          <p className="text-xs text-default-400 italic">No document file attached</p>
        )
      case 'LINK':
        return (
          <a
            href={solution.solution_content}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 p-2.5 bg-default-100 hover:bg-default-200 text-primary rounded-xl font-medium text-xs transition-colors truncate"
          >
            <LinkIcon size={14} className="shrink-0" />
            <span className="truncate">{solution.solution_content}</span>
            <ExternalLink size={12} className="shrink-0 ml-auto" />
          </a>
        )
      case 'TEXT':
      default:
        return (
          <div className="p-3 bg-default-50 dark:bg-default-100/30 rounded-xl border border-divider/40">
            <p className="text-xs text-default-700 whitespace-pre-wrap line-clamp-4 leading-relaxed font-mono">
              {solution.solution_content}
            </p>
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header with Navigation Controls */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-success/15 text-success flex items-center justify-center">
            <Award size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              Solutions
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success/15 text-success">
                {solutions.length} Solved
              </span>
            </h2>
          </div>
        </div>

        {solutions.length > 1 && (
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
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden py-2">
          {[1, 2].map((i) => (
            <div key={i} className="min-w-[340px] sm:min-w-[380px] h-64 rounded-2xl bg-default-200 animate-pulse" />
          ))}
        </div>
      ) : solutions.length === 0 ? (
        <Card className="shadow-xs border border-divider/60 bg-background">
          <CardBody className="p-8 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-success/10 text-success flex items-center justify-center">
              <Award size={28} />
            </div>
            <div>
              <h4 className="font-bold text-sm">No challenge solutions yet</h4>
              <p className="text-default-400 text-xs mt-1 max-w-sm">
                {isOwnProfile
                  ? 'Join communities and submit answers to coding challenges and bounties to build your solutions portfolio!'
                  : 'This user has not submitted any challenge solutions yet.'}
              </p>
            </div>
            {isOwnProfile && (
              <Button
                size="sm"
                color="success"
                variant="flat"
                className="mt-1 font-semibold"
                onClick={() => router.push('/dashboard')}
              >
                Browse Challenges
              </Button>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="relative group/container">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {solutions.map((item) => (
              <Card
                key={item.id}
                className="w-[340px] sm:w-[380px] shrink-0 snap-start border border-divider/60 bg-background shadow-xs hover:shadow-md transition-all rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <CardBody className="p-4 flex flex-col gap-3">
                  {/* Top: Challenge Context Box */}
                  <div className="p-3 rounded-xl bg-default-100/70 border border-divider/50 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-success flex items-center gap-1">
                          <CheckCircle2 size={12} /> Solved Challenge
                        </span>
                      </div>
                      {item.community_name && (
                        <Chip
                          size="sm"
                          variant="flat"
                          color="secondary"
                          className="text-[10px] h-5 cursor-pointer"
                          onClick={() => item.community_id && router.push(`/communities/${item.community_id}`)}
                        >
                          {item.community_name}
                        </Chip>
                      )}
                    </div>

                    <h4 className="font-bold text-xs text-foreground line-clamp-1">
                      {item.challenge_title || item.challenge_content?.slice(0, 50) || 'Community Challenge'}
                    </h4>

                    {item.challenge_content && (
                      <p className="text-[11px] text-default-500 line-clamp-2 leading-relaxed">
                        {item.challenge_content}
                      </p>
                    )}
                  </div>

                  {/* Middle: Submitted Solution Content */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-default-600">Submitted Solution</span>
                      <Chip
                        size="sm"
                        variant="dot"
                        color="success"
                        className="text-[10px] h-5 border-none font-semibold"
                      >
                        {item.solution_challenge_data?.type || 'TEXT'}
                      </Chip>
                    </div>

                    {renderSolutionPreview(item)}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-divider/40 text-[11px] text-default-400">
                    <span>{new Date(item.solution_created_at).toLocaleDateString()}</span>
                    {item.community_id && (
                      <button
                        onClick={() => router.push(`/communities/${item.community_id}`)}
                        className="text-primary text-[11px] font-semibold hover:underline flex items-center gap-1"
                      >
                        View in Community <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Right Floating Arrow on desktop hover */}
          {solutions.length > 2 && (
            <Button
              isIconOnly
              size="md"
              radius="full"
              variant="solid"
              color="default"
              className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 shadow-lg bg-background/90 backdrop-blur-md border border-divider hover:scale-105 transition-transform"
              onClick={() => scroll('right')}
            >
              <ChevronRight size={20} />
            </Button>
          )}
        </div>
      )}

      {/* Report Button Just Below Solution Section - Only visible to profile owner */}
      {isOwnProfile && (
        <>
          <div className="flex items-center justify-between pt-1 px-1 flex-wrap gap-2">
            <p className="text-xs text-default-400">
              {solutions.length > 0 
                ? `Download a verified portfolio report of your ${solutions.length} solved ${solutions.length === 1 ? 'challenge' : 'challenges'} for your resume.`
                : 'Solve challenges to generate a verified portfolio report for your resume.'}
            </p>
            <Button
              color="primary"
              variant="flat"
              size="sm"
              radius="full"
              className="font-semibold shadow-2xs hover:shadow-xs shrink-0"
              startContent={<FileText size={15} />}
              isDisabled={solutions.length === 0}
              onClick={() => setIsReportOpen(true)}
            >
              Report
            </Button>
          </div>

          <SolutionReportModal
            isOpen={isReportOpen}
            onClose={() => setIsReportOpen(false)}
            solutions={solutions}
            userProfile={userProfile}
            backendUrl={backendUrl}
          />
        </>
      )}
    </div>
  )
}
