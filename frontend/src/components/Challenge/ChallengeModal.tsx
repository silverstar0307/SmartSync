import React, { useState, useRef } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea, Select, SelectItem } from '@nextui-org/react'
import { Upload, X } from 'lucide-react'
import api from '@/lib/api'

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  onSuccess: () => void;
}

export default function ChallengeModal({ isOpen, onClose, communityId, onSuccess }: ChallengeModalProps) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('TEXT')
  const [objective, setObjective] = useState('')
  const [resource, setResource] = useState('')
  const [difficulty, setDifficulty] = useState('EASY')
  const [file, setFile] = useState<File | null>(null)
  const [textInput, setTextInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!objective.trim()) return

    setIsLoading(true)
    try {
      let mediaUrls: string[] = []
      
      // Upload file if selected
      if (type !== 'TEXT' && type !== 'LINK' && file) {
        const formData = new FormData()
        formData.append('file', file)
        const uploadRes = await api.post('/posts/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        if (uploadRes.data?.fileUrl) {
          mediaUrls.push(uploadRes.data.fileUrl)
        }
      }

      const challengeData = {
        type,
        objective,
        resource,
        difficulty,
        input: type === 'TEXT' || type === 'LINK' ? textInput : undefined
      }

      await api.post('/posts', {
        title,
        content: objective, // Put objective as main content to be safe if content is required
        media: mediaUrls,
        community_id: communityId,
        post_type: 'challenge',
        challenge_data: challengeData
      })

      // Reset
      setTitle('')
      setType('TEXT')
      setObjective('')
      setResource('')
      setDifficulty('EASY')
      setFile(null)
      setTextInput('')
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Failed to create challenge:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} placement="center" size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Raise a New Challenge
            </ModalHeader>
            <ModalBody className="flex flex-col gap-4">
              <Input
                label="Challenge Title"
                placeholder="e.g. Build a Web Scraper"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                variant="bordered"
              />
              
              <div className="flex gap-4">
                <Select
                  label="Problem Type"
                  selectedKeys={[type]}
                  onChange={(e) => setType(e.target.value)}
                  variant="bordered"
                  className="flex-1"
                >
                  <SelectItem key="TEXT" value="TEXT">TEXT</SelectItem>
                  <SelectItem key="IMAGE" value="IMAGE">IMAGE</SelectItem>
                  <SelectItem key="VIDEO" value="VIDEO">VIDEO</SelectItem>
                  <SelectItem key="PDF" value="PDF">PDF</SelectItem>
                  <SelectItem key="LINK" value="LINK">LINK</SelectItem>
                </Select>

                <Select
                  label="Difficulty Level"
                  selectedKeys={[difficulty]}
                  onChange={(e) => setDifficulty(e.target.value)}
                  variant="bordered"
                  className="flex-1"
                >
                  <SelectItem key="EASY" value="EASY">EASY</SelectItem>
                  <SelectItem key="MODERATE" value="MODERATE">MODERATE</SelectItem>
                  <SelectItem key="HARD" value="HARD">HARD</SelectItem>
                </Select>
              </div>

              {(type === 'TEXT' || type === 'LINK') ? (
                <Textarea
                  label={`Input (${type})`}
                  placeholder={type === 'LINK' ? 'https://...' : 'Type the problem statement here...'}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  variant="bordered"
                />
              ) : (
                <div className="border-2 border-dashed border-divider rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-default-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept={
                      type === 'IMAGE' ? 'image/*' :
                      type === 'VIDEO' ? 'video/*' :
                      type === 'PDF' ? 'application/pdf' : '*'
                    }
                  />
                  {file ? (
                    <div className="flex items-center gap-2 text-primary">
                      <span className="font-semibold">{file.name}</span>
                      <Button size="sm" isIconOnly variant="light" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="text-default-400" />
                      <p className="text-sm font-semibold text-default-600">Click to upload {type.toLowerCase()}</p>
                      <p className="text-xs text-default-400">Max size 50MB</p>
                    </>
                  )}
                </div>
              )}

              <Textarea
                label="Objective"
                placeholder="What should be achieved? Describe the task clearly."
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                isRequired
                variant="bordered"
                minRows={3}
              />
              
              <Textarea
                label="Resources (Optional)"
                placeholder="Links to docs, API references, or hints..."
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                variant="bordered"
                minRows={2}
              />
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="flat" onClick={onClose} isDisabled={isLoading}>
                Cancel
              </Button>
              <Button color="primary" onClick={handleSubmit} isLoading={isLoading} className="bg-gradient-to-r from-amber-500 to-orange-500 font-bold shadow-md">
                Raise Challenge
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
