import React, { useEffect, useState } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, Avatar, Spinner } from '@nextui-org/react'
import { FileText, Link as LinkIcon, Download } from 'lucide-react'
import api from '@/lib/api'

interface SolutionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeId: number;
}

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '')

export default function SolutionsModal({ isOpen, onClose, challengeId }: SolutionsModalProps) {
  const [solutions, setSolutions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && challengeId) {
      fetchSolutions()
    }
  }, [isOpen, challengeId])

  const fetchSolutions = async () => {
    setIsLoading(true)
    try {
      const res = await api.get(`/posts/${challengeId}/replies`)
      // Filter only submissions if there are normal replies too, but standard replies might just be comments
      const submissionReplies = res.data.filter((r: any) => r.post_type === 'challenge_submission')
      setSolutions(submissionReplies)
    } catch (error) {
      console.error('Failed to fetch solutions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderSolutionContent = (solution: any) => {
    const type = solution.challenge_data?.type || 'TEXT'
    const content = solution.content
    const media = solution.media && solution.media.length > 0 ? `${BACKEND_URL}${solution.media[0]}` : null

    switch (type) {
      case 'IMAGE':
        return media ? <img src={media} alt="Solution" className="rounded-lg max-w-full h-auto max-h-64 object-contain" /> : <p>No image attached.</p>
      case 'VIDEO':
        return media ? <video src={media} controls className="rounded-lg max-w-full max-h-64" /> : <p>No video attached.</p>
      case 'PDF':
      case 'FILE':
        return media ? (
          <a href={media} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-500 hover:underline p-3 bg-blue-50 rounded-lg w-fit">
            <FileText size={20} />
            View PDF Document
            <Download size={16} />
          </a>
        ) : <p>No file attached.</p>
      case 'LINK':
        return (
          <a href={content} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-500 hover:underline">
            <LinkIcon size={16} />
            {content}
          </a>
        )
      case 'TEXT':
      default:
        return <p className="text-sm text-default-700 whitespace-pre-wrap bg-default-50 p-3 rounded-lg">{content}</p>
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} placement="center" size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-lg font-bold">
              Challenge Solutions
            </ModalHeader>
            <ModalBody className="flex flex-col gap-4 pb-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : solutions.length === 0 ? (
                <div className="text-center py-8 text-default-400 italic bg-default-50 rounded-xl">
                  No solutions have been submitted yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {solutions.map((solution) => (
                    <div key={solution.id} className="border border-divider rounded-xl p-4 shadow-sm bg-white">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar 
                          src={solution.profile_photo ? `${BACKEND_URL}${solution.profile_photo}` : undefined} 
                          name={solution.username?.charAt(0).toUpperCase()} 
                          size="sm" 
                          className="bg-primary/10 text-primary font-semibold"
                        />
                        <div>
                          <p className="font-semibold text-sm">{solution.first_name || solution.last_name ? `${solution.first_name || ''} ${solution.last_name || ''}`.trim() : solution.username}</p>
                          <p className="text-[10px] text-default-400">{new Date(solution.created_at).toLocaleString()}</p>
                        </div>
                        <div className="ml-auto">
                          <span className="text-[10px] px-2 py-1 bg-default-100 rounded-full font-semibold text-default-500">
                            {solution.challenge_data?.type || 'TEXT'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        {renderSolutionContent(solution)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
