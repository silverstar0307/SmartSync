import React, { useState, useRef } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea, Select, SelectItem } from '@nextui-org/react'
import { Upload, X } from 'lucide-react'
import api from '@/lib/api'

interface SubmitSolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeId: number;
  communityId: string;
  onSuccess: () => void;
}

export default function SubmitSolutionModal({ isOpen, onClose, challengeId, communityId, onSuccess }: SubmitSolutionModalProps) {
  const [type, setType] = useState('TEXT')
  const [textInput, setTextInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (type === 'TEXT' || type === 'LINK') {
      if (!textInput.trim()) return
    } else {
      if (!file) return
    }

    setIsLoading(true)
    try {
      let mediaUrls: string[] = []
      
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

      await api.post('/posts', {
        content: (type === 'TEXT' || type === 'LINK') ? textInput : `Solution attached as ${type}`,
        media: mediaUrls,
        community_id: communityId,
        parent_post_id: challengeId,
        post_type: 'challenge_submission',
        challenge_data: { type }
      })

      setType('TEXT')
      setTextInput('')
      setFile(null)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Failed to submit solution:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} placement="center" size="md">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-lg font-bold text-success-600">
              Submit Your Solution
            </ModalHeader>
            <ModalBody className="flex flex-col gap-4">
              <Select
                label="Submission Type"
                selectedKeys={[type]}
                onChange={(e) => setType(e.target.value)}
                variant="bordered"
              >
                <SelectItem key="TEXT" value="TEXT">TEXT</SelectItem>
                <SelectItem key="IMAGE" value="IMAGE">IMAGE</SelectItem>
                <SelectItem key="VIDEO" value="VIDEO">VIDEO</SelectItem>
                <SelectItem key="PDF" value="PDF">PDF</SelectItem>
                <SelectItem key="LINK" value="LINK">LINK</SelectItem>
              </Select>

              {(type === 'TEXT' || type === 'LINK') ? (
                <Textarea
                  label={`Your Solution (${type})`}
                  placeholder={type === 'LINK' ? 'https://...' : 'Type your solution here...'}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  variant="bordered"
                  minRows={4}
                />
              ) : (
                <div className="border-2 border-dashed border-divider rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:bg-default-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
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
                    <div className="flex flex-col items-center gap-2 text-primary">
                      <span className="font-semibold text-center">{file.name}</span>
                      <Button size="sm" color="danger" variant="flat" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                        Remove File
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="text-default-400 w-10 h-10" />
                      <p className="text-sm font-semibold text-default-600">Click to upload {type.toLowerCase()}</p>
                      <p className="text-xs text-default-400">Max size 50MB</p>
                    </>
                  )}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="flat" onClick={onClose} isDisabled={isLoading}>
                Cancel
              </Button>
              <Button color="success" onClick={handleSubmit} isLoading={isLoading} className="text-white font-bold shadow-md">
                Submit Solution
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
