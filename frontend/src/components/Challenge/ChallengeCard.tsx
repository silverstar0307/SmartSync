import React, { useState } from 'react'
import { Card, CardBody, Button, Avatar, Chip } from '@nextui-org/react'
import { Heart, MessageSquare, Trophy, FileText, ExternalLink, PlaySquare, Image as ImageIcon, CheckSquare } from 'lucide-react'
import SubmitSolutionModal from './SubmitSolutionModal'
import SolutionsModal from './SolutionsModal'

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '')

export default function ChallengeCard({ post, communityId, onUpdate, adminId }: { post: any, communityId: string, onUpdate: () => void, adminId?: number }) {
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false)

  const cData = post.challenge_data || {}
  const type = cData.type || 'TEXT'
  const difficulty = cData.difficulty || 'EASY'
  const input = cData.input
  const media = post.media && post.media.length > 0 ? `${BACKEND_URL}${post.media[0]}` : null
  const isPostAdmin = (adminId && (post.author_id === adminId || post.user_id === adminId || post.sender_id === adminId))

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'HARD': return 'danger'
      case 'MODERATE': return 'warning'
      case 'EASY':
      default: return 'success'
    }
  }

  const renderInput = () => {
    switch (type) {
      case 'IMAGE':
        return media ? <img src={media} alt="Challenge Input" className="rounded-lg max-w-full h-auto max-h-64 object-contain my-3 border border-divider" /> : null
      case 'VIDEO':
        return media ? <video src={media} controls className="rounded-lg max-w-full my-3 border border-divider" /> : null
      case 'PDF':
        return media ? (
          <a href={media} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-blue-600 font-semibold p-4 my-3 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-xl transition-colors">
            <FileText size={24} />
            View Challenge Document
          </a>
        ) : null
      case 'LINK':
        return input ? (
          <a href={input} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary font-semibold hover:underline my-2 break-all">
            <ExternalLink size={18} />
            {input}
          </a>
        ) : null
      case 'TEXT':
      default:
        return input ? (
          <div className="bg-default-50 p-4 rounded-xl border border-divider my-3">
            <p className="text-sm font-medium text-default-800 whitespace-pre-wrap">{input}</p>
          </div>
        ) : null
    }
  }

  return (
    <>
      <Card className="border border-amber-200 shadow-md bg-gradient-to-b from-amber-50/30 to-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-bl-full -z-0 blur-xl pointer-events-none" />
        <CardBody className="p-5 gap-4 relative z-10">
          
          <div className="flex justify-between items-start gap-4">
            <div className="flex gap-3 items-center">
              <Avatar src={post.profile_photo ? `${BACKEND_URL}${post.profile_photo}` : undefined} name={post.username?.charAt(0).toUpperCase()} size="sm" className="bg-amber-100 text-amber-600 font-bold" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm truncate text-default-900">{post.username}</p>
                  {isPostAdmin && (
                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30 rounded-md shrink-0 uppercase tracking-wider">
                      Admin
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Trophy size={12} className="text-amber-500" />
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Challenge</p>
                </div>
              </div>
            </div>
            
            <Chip size="sm" color={getDifficultyColor(difficulty)} variant="flat" className="font-bold border-1">
              {difficulty}
            </Chip>
          </div>

          <div>
            {post.title && <h3 className="text-lg font-bold text-default-900 mb-2 leading-tight">{post.title}</h3>}
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-default-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <CheckSquare size={14} className="text-primary" /> Objective
                </h4>
                <p className="text-sm text-default-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </div>

              {renderInput()}

              {cData.resource && (
                <div>
                  <h4 className="text-xs font-bold text-default-500 uppercase tracking-wider mb-1">Resources</h4>
                  <p className="text-xs text-blue-600 whitespace-pre-wrap hover:underline cursor-pointer">{cData.resource}</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-divider mt-2 flex flex-col gap-3">
            <Button 
              className="w-full font-bold shadow-sm bg-default-900 text-white hover:bg-default-800 transition-colors"
              onClick={() => setIsSubmitOpen(true)}
            >
              Submit Solution
            </Button>
            
            <div className="flex items-center justify-between">
              <button 
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                onClick={() => setIsSolutionsOpen(true)}
              >
                View Solutions
              </button>
              <p className="text-[11px] font-medium text-default-500">
                <span className="font-bold text-default-700">{post.reply_count || 0}</span> members had completed the challenge
              </p>
            </div>
          </div>

        </CardBody>
      </Card>

      <SubmitSolutionModal 
        isOpen={isSubmitOpen} 
        onClose={() => setIsSubmitOpen(false)} 
        challengeId={post.id}
        communityId={communityId}
        onSuccess={onUpdate}
      />
      
      <SolutionsModal 
        isOpen={isSolutionsOpen} 
        onClose={() => setIsSolutionsOpen(false)} 
        challengeId={post.id}
      />
    </>
  )
}
