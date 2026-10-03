'use client'

import React, { useState } from 'react'
import { Card, CardBody, Avatar, Button, Chip } from '@nextui-org/react'
import { Bell, Briefcase, FileCheck, CheckCircle2, Building, CalendarCheck, FileText, ArrowRight } from 'lucide-react'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'offer',
      company: 'Google',
      logo: 'G',
      title: 'Offer Letter Received!',
      message: 'Congratulations! Google has extended an offer for the Software Engineering Intern role. Please review the attached document.',
      time: '2 hours ago',
      read: false,
      action: 'View Offer Letter'
    },
    {
      id: 2,
      type: 'interview',
      company: 'Amazon',
      logo: 'A',
      title: 'Interview Scheduled',
      message: 'Your resume was accepted. We would like to schedule a technical interview with you next Tuesday at 10:00 AM PST.',
      time: '1 day ago',
      read: false,
      action: 'Confirm Time'
    },
    {
      id: 3,
      type: 'resume_accepted',
      company: 'Microsoft',
      logo: 'M',
      title: 'Resume Shortlisted',
      message: 'Your application for the Product Management Internship has been shortlisted. The recruitment team will contact you soon.',
      time: '3 days ago',
      read: true,
      action: 'View Status'
    }
  ])

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const getIcon = (type: string) => {
    switch(type) {
      case 'offer': return <FileCheck size={20} className="text-success" />
      case 'interview': return <CalendarCheck size={20} className="text-primary" />
      case 'resume_accepted': return <CheckCircle2 size={20} className="text-secondary" />
      default: return <Bell size={20} className="text-default-400" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Company Notifications</h1>
          <p className="text-default-500 mt-1">Updates on your applications, interviews, and offers.</p>
        </div>
        <Button 
          variant="flat" 
          color="primary" 
          size="sm" 
          className="font-semibold"
          onClick={markAllAsRead}
        >
          Mark all as read
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {notifications.map((notif) => (
          <Card 
            key={notif.id} 
            className={`shadow-sm border transition-all ${
              notif.read ? 'bg-default-50/50 border-divider' : 'bg-background border-primary/30 shadow-primary/5'
            }`}
          >
            <CardBody className="p-5">
              <div className="flex gap-4">
                <Avatar 
                  name={notif.logo} 
                  className={`w-12 h-12 text-lg font-bold shrink-0 ${
                    notif.type === 'offer' ? 'bg-success/10 text-success' :
                    notif.type === 'interview' ? 'bg-primary/10 text-primary' :
                    'bg-secondary/10 text-secondary'
                  }`}
                />
                
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold text-base ${!notif.read ? 'text-foreground' : 'text-default-700'}`}>
                          {notif.title}
                        </h3>
                        {!notif.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>}
                      </div>
                      <p className="text-sm font-semibold text-default-500 flex items-center gap-1 mt-0.5">
                        <Building size={14} /> {notif.company}
                      </p>
                    </div>
                    <span className="text-xs text-default-400 whitespace-nowrap">{notif.time}</span>
                  </div>

                  <p className={`mt-3 text-sm leading-relaxed ${notif.read ? 'text-default-500' : 'text-foreground/90'}`}>
                    {notif.message}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <Button 
                      size="sm" 
                      color={
                        notif.type === 'offer' ? 'success' :
                        notif.type === 'interview' ? 'primary' :
                        'secondary'
                      }
                      variant="solid" 
                      className="font-medium px-4 shadow-sm"
                      endContent={<ArrowRight size={14} />}
                    >
                      {notif.action}
                    </Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}

        {notifications.length === 0 && (
          <div className="text-center py-16 text-default-400 bg-default-50 rounded-2xl border border-dashed border-divider">
            <Bell size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-semibold text-lg text-default-600">No new notifications</p>
            <p className="text-sm mt-1">When companies respond to your profile, you'll see it here.</p>
          </div>
        )}
      </div>
    </div>
  )
}
