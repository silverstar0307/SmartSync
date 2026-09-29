'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardBody, Button, Input, Textarea, Select, SelectItem, Divider, Avatar } from '@nextui-org/react'
import { User, FileText, BookOpen, GitBranch, ArrowLeft, Camera } from 'lucide-react'
import { useAuthStore } from '@/store/authSlice'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '')

const DIVISIONS = ['A', 'B', 'C', 'D', 'E', 'F']
const BRANCHES = [
  'Computer Engineering',
  'Information Technology',
  'Electronics & Telecommunication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'AI & Data Science',
  'AI & Machine Learning',
  'Robotics & Automation',
  'Chemical Engineering',
  'Instrumentation Engineering',
]

export default function EditProfilePage() {
  const { user, updateUser } = useAuthStore()
  const router = useRouter()

  const [firstName, setFirstName]   = useState('')
  const [lastName, setLastName]     = useState('')
  const [bio, setBio]               = useState('')
  const [division, setDivision]     = useState('')
  const [branch, setBranch]         = useState('')
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading]   = useState(true)
  const [isSaving, setIsSaving]     = useState(false)
  const [success, setSuccess]       = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    if (!user?.id) return
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/${user.id}`)
        const p = res.data
        setFirstName(p.first_name || '')
        setLastName(p.last_name || '')
        setBio(p.bio || '')
        setDivision(p.division || '')
        setBranch(p.college_name || '') // college_name stores branch
        setPhotoPreviewUrl(p.profile_photo ? `${BACKEND_URL}${p.profile_photo}` : null)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [user])

  const handleSave = async () => {
    if (!user?.id) return
    setIsSaving(true)
    setSuccess(false)
    setError('')

    try {
      // 1. Upload photo if selected
      let uploadedPhotoUrl = null
      if (selectedPhotoFile) {
        const formData = new FormData()
        formData.append('profile_photo', selectedPhotoFile)
        const uploadRes = await api.post(`/users/${user.id}/profile-photo`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        uploadedPhotoUrl = uploadRes.data.profile_photo
      }

      // 2. Save details
      const res = await api.put(`/users/${user.id}`, {
        first_name: firstName,
        last_name:  lastName,
        bio,
        division,
        branch,
      })
      // Update Zustand store with new data
      updateUser({
        first_name: res.data.first_name,
        last_name:  res.data.last_name,
        bio: res.data.bio,
        division: res.data.division,
        college_name: res.data.college_name,
        profile_photo: uploadedPhotoUrl || user?.profile_photo
      })
      setSuccess(true)
      setTimeout(() => router.push('/profile/me'), 1200)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save profile.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse max-w-2xl mx-auto flex flex-col gap-4">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-14 bg-default-100 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button isIconOnly variant="light" onClick={() => router.push('/profile/me')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <p className="text-default-500 text-sm">Update your personal information</p>
        </div>
      </div>

      <Card className="shadow-sm border-none">
        <CardBody className="p-8 flex flex-col gap-5">
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm p-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-success/10 border border-success/30 text-success text-sm p-3 rounded-lg">
              ✅ Profile updated! Redirecting...
            </div>
          )}

          {/* Profile Photo Upload */}
          <div className="flex flex-col items-center gap-3 mb-4">
            <div 
              className="relative w-28 h-28 rounded-full group cursor-pointer overflow-hidden border-4 border-primary/20 shadow-md flex items-center justify-center bg-default-100"
              onClick={() => document.getElementById('profile-photo-file')?.click()}
              title="Click to upload profile photo"
            >
              <Avatar
                src={photoPreviewUrl || undefined}
                name={firstName?.charAt(0).toUpperCase() || 'U'}
                className="w-full h-full text-3xl font-bold bg-primary text-primary-foreground"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white mb-1" />
                <span className="text-xs text-white font-medium">Change</span>
              </div>
            </div>
            <input
              type="file"
              id="profile-photo-file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setSelectedPhotoFile(file)
                  setPhotoPreviewUrl(URL.createObjectURL(file))
                }
              }}
            />
            <Button
              size="sm"
              variant="flat"
              color="primary"
              startContent={<Camera size={16} />}
              onClick={() => document.getElementById('profile-photo-file')?.click()}
            >
              Change Photo
            </Button>
            <p className="text-[11px] text-default-400">Click avatar or button to upload new profile photo</p>
          </div>

          {/* Read-only email */}
          <Input
            label="Email"
            value={user?.email || ''}
            isReadOnly
            variant="bordered"
            description="Email cannot be changed."
            classNames={{ inputWrapper: 'bg-default-50' }}
          />

          <Divider />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="Enter your first name"
              variant="bordered"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              startContent={<User size={16} className="text-default-400" />}
            />
            <Input
              label="Last Name"
              placeholder="Enter your last name"
              variant="bordered"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              startContent={<User size={16} className="text-default-400" />}
            />
          </div>

          <Textarea
            label="Bio"
            placeholder="Tell other students about yourself..."
            variant="bordered"
            value={bio}
            onChange={e => setBio(e.target.value)}
            minRows={3}
            startContent={<FileText size={16} className="text-default-400 mt-1" />}
          />

          <Divider />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Division Dropdown */}
            <Select
              label="Division"
              placeholder="Select your division"
              variant="bordered"
              selectedKeys={division ? [division] : []}
              onSelectionChange={keys => setDivision(Array.from(keys)[0] as string)}
              startContent={<BookOpen size={16} className="text-default-400 flex-shrink-0" />}
            >
              {DIVISIONS.map(d => (
                <SelectItem key={d}>{d}</SelectItem>
              ))}
            </Select>

            {/* Branch Dropdown */}
            <Select
              label="Engineering Branch"
              placeholder="Select your branch"
              variant="bordered"
              selectedKeys={branch ? [branch] : []}
              onSelectionChange={keys => setBranch(Array.from(keys)[0] as string)}
              startContent={<GitBranch size={16} className="text-default-400 flex-shrink-0" />}
            >
              {BRANCHES.map(b => (
                <SelectItem key={b}>{b}</SelectItem>
              ))}
            </Select>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="flat" onClick={() => router.push('/profile/me')}>
              Cancel
            </Button>
            <Button color="primary" onClick={handleSave} isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
