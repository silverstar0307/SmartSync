'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardBody, Avatar, Button, Tabs, Tab } from '@nextui-org/react'
import { Check, X, Bell } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '')

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<string>('all')

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications')
        setNotifications(response.data)
      } catch (error) {
        console.error('Failed to fetch notifications', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (error) {
      console.error('Failed to mark as read', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (error) {
      console.error('Failed to mark all as read', error)
    }
  }

  const handleAcceptRequest = async (requestId: number, notificationId: number, type: string) => {
    try {
      if (type === 'COMMUNITY_REQUEST') {
        await api.post(`/communities/${requestId}/accept-invitation`)
        alert('Joined community successfully!')
      } else if (type === 'COMMUNITY_JOIN_REQUEST') {
        await api.post(`/communities/join-requests/${requestId}/accept`)
        alert('User join request accepted!')
      } else {
        await api.post(`/connections/request/${requestId}/accept`)
        alert('Connection request accepted!')
      }
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n))
    } catch (error: any) {
      console.error(error)
      alert(error.response?.data?.message || 'Failed to accept request.')
    }
  }

  const handleDeclineRequest = async (requestId: number, notificationId: number, type: string) => {
    try {
      if (type === 'COMMUNITY_REQUEST') {
        await api.patch(`/notifications/${notificationId}/read`)
        alert('Invitation declined.')
      } else if (type === 'COMMUNITY_JOIN_REQUEST') {
        await api.post(`/communities/join-requests/${requestId}/decline`)
        alert('User join request declined.')
      } else {
        await api.post(`/connections/request/${requestId}/decline`)
        alert('Connection request declined.')
      }
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n))
    } catch (error: any) {
      console.error(error)
      alert(error.response?.data?.message || 'Failed to decline request.')
    }
  }

  const getDisplayMessage = (notification: any) => {
    if (notification.type === 'CONNECTION_REQUEST' && notification.message === 'Someone wants to connect with you.' && notification.trigger_username) {
      return (
        <span>
          <Link href={`/profile/${notification.triggered_by}`} className="font-bold hover:underline cursor-pointer">
            {notification.trigger_username}
          </Link> wants to connect with you.
        </span>
      )
    }
    if (notification.type === 'COMMUNITY_JOIN_REQUEST' && notification.message === 'A member requested to join your community.' && notification.trigger_username) {
      return (
        <span>
          <Link href={`/profile/${notification.triggered_by}`} className="font-bold hover:underline cursor-pointer">
            {notification.trigger_username}
          </Link> wants to join your community.
        </span>
      )
    }
    return <span>{notification.message}</span>
  }

  const filteredNotifications = notifications.filter(notification => {
    if (selectedTab === 'requests') {
      return (
        notification.type?.includes('REQUEST') ||
        notification.type?.includes('INVITATION') ||
        notification.type?.includes('JOIN')
      )
    }
    if (selectedTab === 'events') {
      return notification.type?.includes('EVENT')
    }
    return true
  })

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell size={28} className="text-primary" />
            Notifications
          </h1>
          <p className="text-default-500 mt-1">Stay updated with your community.</p>
        </div>
        <Button variant="flat" color="primary" onClick={markAllAsRead}>
          Mark all as read
        </Button>
      </div>

      <Tabs 
        aria-label="Notification Filters" 
        color="primary" 
        variant="underlined"
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
      >
        <Tab key="all" title="All" />
        <Tab key="requests" title="Requests" />
        <Tab key="events" title="Events" />
      </Tabs>

      <div className="flex flex-col gap-3">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse shadow-sm border-none">
              <CardBody className="h-20 bg-default-100"></CardBody>
            </Card>
          ))
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12 text-default-500 bg-default-50 rounded-xl">
            {selectedTab === 'all' 
              ? 'You have no notifications.' 
              : selectedTab === 'requests' 
                ? 'You have no pending requests.' 
                : 'You have no event notifications.'}
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <Card 
              key={notification.id} 
              className={`shadow-sm border-none transition-colors ${!notification.is_read ? 'bg-primary/5' : ''}`}
            >
              <CardBody className="flex flex-row items-center justify-between p-4 gap-4">
                <div className="flex items-center gap-4">
                  {notification.triggered_by ? (
                    <Link href={`/profile/${notification.triggered_by}`}>
                      <Avatar 
                        src={notification.trigger_photo ? `${BACKEND_URL}${notification.trigger_photo}` : undefined} 
                        name={notification.trigger_username?.charAt(0).toUpperCase() || 'U'} 
                        color="secondary" 
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </Link>
                  ) : (
                    <Avatar 
                      src={notification.trigger_photo ? `${BACKEND_URL}${notification.trigger_photo}` : undefined} 
                      name={notification.trigger_username?.charAt(0).toUpperCase() || 'U'} 
                      color="secondary" 
                    />
                  )}
                  <div>
                    <p className="font-medium text-foreground">{notification.title}</p>
                    <p className="text-sm text-default-500">{getDisplayMessage(notification)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {notification.type?.includes('REQUEST') && !notification.is_read && (
                    <>
                      <Button 
                        size="sm" 
                        color="primary" 
                        isIconOnly 
                        onClick={() => handleAcceptRequest(notification.related_entity_id, notification.id, notification.type)}
                      >
                        <Check size={16} />
                      </Button>
                      <Button 
                        size="sm" 
                        color="danger" 
                        variant="flat" 
                        isIconOnly 
                        onClick={() => handleDeclineRequest(notification.related_entity_id, notification.id, notification.type)}
                      >
                        <X size={16} />
                      </Button>
                    </>
                  )}
                  {!notification.is_read && (
                    <Button size="sm" variant="light" onClick={() => markAsRead(notification.id)}>
                      Mark Read
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
