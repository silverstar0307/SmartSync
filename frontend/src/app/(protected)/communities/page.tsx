'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardBody, Button, Input, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Textarea, Checkbox, RadioGroup, Radio, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Select, SelectItem } from '@nextui-org/react'
import { Search, Users, Plus, Check, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authSlice'
import api from '@/lib/api'
import { getCommunityTags } from '@/lib/interestsData'

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState('All')
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const router = useRouter()
  const { user } = useAuthStore()
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all')

  // Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set([]))
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const predefinedTags = getCommunityTags()

  const fetchCommunities = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/communities')
      setCommunities(response.data)
    } catch (error) {
      console.error('Failed to fetch communities', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCommunities()
  }, [])

  const handleCreateCommunity = async (onClose: () => void) => {
    if (!name.trim()) {
      setErrorMessage('Community name is required.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const tags = Array.from(selectedTags)

    try {
      const response = await api.post('/communities', {
        name,
        slug,
        description,
        tags,
        is_public: false, // Default to private
        requires_approval: requiresApproval
      })
      router.push(`/communities/${response.data.id}`)
      onClose()
      
      // Reset form
      setName('')
      setDescription('')
      setSelectedTags(new Set([]))
      setRequiresApproval(false)
    } catch (error: any) {
      console.error(error)
      setErrorMessage(error.response?.data?.message || 'Failed to create community.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleJoin = async (communityId: number) => {
    try {
      await api.post(`/communities/${communityId}/join-request`)
      alert('Join request sent! Waiting for admin approval.')
      fetchCommunities()
    } catch (error) {
      console.error(error)
      alert('Error joining community.')
    }
  }

  const filteredCommunities = communities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.description?.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    
    // Always filter for private communities only (since public is removed)
    if (c.is_public === true) return false
    
    if (selectedTag !== 'All') {
      const hasTag = c.tags?.some((t: string) => t.toLowerCase() === selectedTag.toLowerCase())
      if (!hasTag) return false
    }

    return true
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Discover Communities</h1>
          <p className="text-default-500 mt-1">Find and join communities based on your interests.</p>
        </div>
        <Button color="primary" startContent={<Plus size={18} />} onClick={onOpen}>
          Create Community
        </Button>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <Input
          classNames={{
            base: "max-w-md",
            inputWrapper: "bg-default-100",
          }}
          placeholder="Search communities by name or keyword..."
          startContent={<Search size={18} className="text-default-400" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />



        <Select
          className="max-w-[250px]"
          aria-label="Filter by Interest"
          placeholder="Sort by Interest"
          selectedKeys={new Set([selectedTag])}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string
            if (selected) {
              setSelectedTag(selected)
            }
          }}
        >
          {["All", ...predefinedTags].map((tag) => (
            <SelectItem key={tag} value={tag}>
              {tag === "All" ? "All Interests" : tag}
            </SelectItem>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="h-48 animate-pulse bg-default-100"></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map(community => (
            <Card key={community.id} className="hover:-translate-y-1 transition-transform">
              <CardBody className="p-5 justify-between h-full min-h-[220px]">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                      {community.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-lg leading-tight truncate">{community.name}</h3>
                        <Chip 
                          size="sm" 
                          variant="flat" 
                          color="danger"
                          className="text-tiny shrink-0 font-semibold"
                        >
                          Private
                        </Chip>
                      </div>
                      <div className="flex items-center text-tiny text-default-500 mt-1">
                        <Users size={12} className="mr-1" />
                        {community.total_members} members
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-default-600 line-clamp-2 min-h-[40px]">
                    {community.description || 'No description available for this community.'}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {community.tags?.slice(0, 3).map((tag: string) => (
                      <Chip key={tag} size="sm" variant="flat" className="bg-default-100">
                        {tag}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-2 flex justify-end">
                  {community.members?.includes(user?.id) ? (
                    <Button 
                      size="sm" 
                      color="secondary" 
                      variant="flat"
                      onClick={() => router.push(`/communities/${community.id}`)}
                    >
                      Enter
                    </Button>
                  ) : community.has_pending_request ? (
                    <Button 
                      size="sm" 
                      color="warning" 
                      variant="flat"
                      isDisabled
                    >
                      Pending
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      color="primary" 
                      variant="flat"
                      onClick={() => handleJoin(community.id)}
                    >
                      Join
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
          
          {filteredCommunities.length === 0 && (
            <div className="col-span-full py-12 text-center text-default-500">
              No communities found matching your search.
            </div>
          )}
        </div>
      )}

      {/* Create Community Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Create a Community</ModalHeader>
              <ModalBody className="flex flex-col gap-4">
                {errorMessage && (
                  <div className="bg-danger/10 border border-danger/30 text-danger text-sm p-3 rounded-lg">
                    {errorMessage}
                  </div>
                )}
                


                <Input
                  label="Community Name"
                  placeholder="e.g. Creative Coding Group"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  isRequired
                />
                <Textarea
                  label="Description"
                  placeholder="Tell students what this community is about."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <Select
                  label="Interest Tag"
                  placeholder="Select a community interest"
                  selectionMode="single"
                  selectedKeys={selectedTags}
                  onSelectionChange={(keys) => setSelectedTags(new Set(Array.from(keys) as string[]))}
                >
                  {predefinedTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </Select>
                <Checkbox 
                  isSelected={requiresApproval} 
                  onValueChange={setRequiresApproval}
                >
                  Require approval to join
                </Checkbox>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onClick={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onClick={() => handleCreateCommunity(onClose)} isLoading={isSubmitting}>
                  Create Community
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
