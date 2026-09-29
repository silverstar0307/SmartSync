'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardBody, Avatar, Button, Spinner, Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from '@nextui-org/react'
import { MessageSquare, Heart, Sparkles, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authSlice'
import api from '@/lib/api'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [posts, setPosts] = useState<any[]>([])
  const [recommendedPeople, setRecommendedPeople] = useState<any[]>([])
  const [recommendedCommunities, setRecommendedCommunities] = useState<any[]>([])
  const [isFeedLoading, setIsFeedLoading] = useState(true)
  const [isMatching, setIsMatching] = useState(false)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        if (!user?.id) return;
        const res = await api.get(`/users/${user.id}/dashboard-feed`);
        setPosts(res.data);
      } catch (error) {
        console.error('Error fetching feed', error);
      } finally {
        setIsFeedLoading(false);
      }
    };

    if (user?.id) {
      fetchFeed();
    }
  }, [user?.id]);

  const handleMatch = async () => {
    setIsMatching(true)
    onOpen() // Open loading overlay modal
    
    try {
      // Hit backend AI match APIs
      const [peopleRes, communitiesRes] = await Promise.all([
        api.get('/recommendations/people'),
        api.get('/recommendations/communities')
      ])
      setRecommendedPeople(peopleRes.data)
      setRecommendedCommunities(communitiesRes.data)
    } catch (error) {
      console.error('Failed to get match recommendations', error)
    } finally {
      setIsMatching(false)
    }
  }

  const handleConnect = async (studentId: number, studentName: string) => {
    try {
      await api.post('/connections/request', { 
        to_user_id: studentId,
        message: `Hi ${studentName}, let's connect!`
      })
      alert(`Connection request sent to ${studentName}!`)
      setRecommendedPeople(prev => prev.filter(p => p.studentId !== studentId))
    } catch (error: any) {
      console.error(error)
      alert(error.response?.data?.message || 'Failed to send request.')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Your Activity Feed</h1>
          <Button color="primary" variant="flat" size="sm">New Post</Button>
        </div>

        {isFeedLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="w-full">
                <CardBody className="h-32 bg-default-100 animate-pulse"></CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.length === 0 && (
              <Card className="w-full">
                <CardBody className="py-8 text-center text-default-500">
                  Join some communities to see the latest activity here!
                </CardBody>
              </Card>
            )}
            {posts.map(post => (
              <Card key={`${post.item_type}-${post.item_id}`} className="w-full cursor-pointer hover:bg-default-50 transition-colors" isPressable onPress={() => router.push(`/communities/${post.community_id}`)}>
                <CardBody className="gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <Avatar name={post.author_name?.charAt(0)?.toUpperCase()} size="sm" color="secondary" />
                      <div>
                        <p className="font-semibold text-sm">{post.author_name} {post.item_type === 'message' ? '(Message)' : '(Post)'}</p>
                        <p className="text-tiny text-default-500">in {post.community_name} • {new Date(post.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-default-700">{post.content}</p>
                  
                  {post.item_type === 'post' && (
                    <div className="flex gap-4 mt-2">
                      <Button size="sm" variant="light" className="text-default-500 min-w-0 px-2" startContent={<Heart size={16} />}>
                        {post.like_count || 0}
                      </Button>
                      <Button size="sm" variant="light" className="text-default-500 min-w-0 px-2" startContent={<MessageSquare size={16} />}>
                        {post.reply_count || 0}
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 border-none shadow-sm">
          <CardBody className="p-6 text-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto text-primary shadow-sm">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Find New Connections</h3>
              <p className="text-sm text-default-500 mt-1">Let our AI match you with students sharing your interests.</p>
            </div>
            <Button color="primary" className="font-medium" onClick={handleMatch} fullWidth>
              Match Me Now
            </Button>
          </CardBody>
        </Card>

        {recommendedPeople.length > 0 || recommendedCommunities.length > 0 ? (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="font-bold mb-3">Recommended People</h3>
              <div className="space-y-3">
                {recommendedPeople.map((person, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-default-50 rounded-xl hover:bg-default-100 transition-all border border-divider/50 hover:border-primary/30">
                    <div className="flex items-center gap-3">
                      <Avatar name={person.studentName?.charAt(0).toUpperCase()} size="sm" className="bg-primary/10 text-primary font-bold" />
                      <div>
                        <p className="text-sm font-semibold">{person.studentName}</p>
                        <p className="text-tiny text-primary font-medium">{person.matchPercentage ?? 90}% Match</p>
                        <p className="text-[10px] text-default-500 mt-0.5 line-clamp-1">{person.reason}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" color="primary" variant="flat" onClick={() => handleConnect(person.studentId, person.studentName)} startContent={<UserPlus size={14} />}>
                        Connect
                      </Button>
                      <Button size="sm" variant="light" onClick={() => router.push(`/profile/${person.studentId}`)}>
                        View Profile
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-3">Recommended Communities</h3>
              <div className="space-y-3">
                {recommendedCommunities.map((community, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-default-50 rounded-xl hover:bg-default-100 transition-all border border-divider/50 hover:border-secondary/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center font-bold text-sm">
                        {community.communityName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{community.communityName}</p>
                        <p className="text-tiny text-secondary font-medium">{community.score ?? 85}% Match</p>
                        <p className="text-[10px] text-default-500 mt-0.5 line-clamp-1">{community.reason}</p>
                      </div>
                    </div>
                    <Button size="sm" color="secondary" variant="flat" onClick={() => router.push(`/communities/${community.id}`)}>
                      Explore
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-default-400 text-center py-4">Click "Match Me Now" to generate recommendations!</p>
        )}
      </div>

      {/* Match Progress Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={!isMatching} hideCloseButton={isMatching}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-center">AI Matchmaker</ModalHeader>
              <ModalBody className="flex flex-col items-center justify-center p-8 gap-4">
                {isMatching ? (
                  <>
                    <Spinner size="lg" color="primary" />
                    <p className="text-default-500 text-sm">Analyzing your interests and calculating match scores...</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-success/20 text-success flex items-center justify-center">
                      <Sparkles size={24} />
                    </div>
                    <p className="text-center font-semibold">Matched Successfully!</p>
                    <p className="text-sm text-default-500 text-center">We found potential connections matching your interests profile. Close this to see details.</p>
                    <Button color="primary" onClick={onClose}>View Matches</Button>
                  </>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
