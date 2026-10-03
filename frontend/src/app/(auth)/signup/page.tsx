'use client'

import React, { useState, useEffect } from 'react'
import { Input, Button, Card, CardBody, CardHeader, Divider, Select, SelectItem } from '@nextui-org/react'
import { Mail, Lock, User, BookOpen, GitBranch } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authSlice'

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

export default function SignupPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [division, setDivision] = useState('')
  const [branch, setBranch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  
  const router = useRouter()
  const { login } = useAuthStore()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-default-50 p-4 py-12">
        <Card className="w-full max-w-md p-6 flex flex-col items-center justify-center min-h-[500px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </Card>
      </div>
    )
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const response = await api.post('/auth/register', { 
        username, 
        email,
        division,
        branch,
        password 
      })
      login(response.data.user, response.data.token)
      router.push('/dashboard')
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.response?.status === 404) {
        setError('Signup endpoint not found (404). Please ensure the backend server is running and NEXT_PUBLIC_API_URL points to your backend API.')
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Cannot connect to backend server. Please verify that the backend API is running on port 5000 and NEXT_PUBLIC_API_URL is configured.')
      } else {
        setError(err.message || 'Failed to create account')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-default-50 p-4 py-12">
      <Card className="w-full max-w-md p-6">
        <CardHeader className="flex flex-col gap-1 items-center mb-4">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-2">S</div>
          <h2 className="text-2xl font-bold">Join Smart Sync</h2>
          <p className="text-default-500">Create an account to connect with peers</p>
        </CardHeader>
        
        <CardBody>
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <Input
              type="text"
              label="Username"
              placeholder="Choose a username"
              variant="bordered"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              startContent={<User size={18} className="text-default-400" />}
              isRequired
            />

            <Input
              type="email"
              label="Email"
              placeholder="Enter your email address"
              variant="bordered"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              startContent={<Mail size={18} className="text-default-400" />}
              isRequired
            />

            {/* Division Dropdown */}
            <Select
              label="Division"
              placeholder="Select your class division"
              variant="bordered"
              selectedKeys={division ? [division] : []}
              onSelectionChange={(keys) => setDivision(Array.from(keys)[0] as string)}
              startContent={<BookOpen size={18} className="text-default-400 flex-shrink-0" />}
            >
              {DIVISIONS.map((div) => (
                <SelectItem key={div}>{div}</SelectItem>
              ))}
            </Select>

            {/* Branch Dropdown */}
            <Select
              label="Branch"
              placeholder="Select your engineering branch"
              variant="bordered"
              selectedKeys={branch ? [branch] : []}
              onSelectionChange={(keys) => setBranch(Array.from(keys)[0] as string)}
              startContent={<GitBranch size={18} className="text-default-400 flex-shrink-0" />}
            >
              {BRANCHES.map((b) => (
                <SelectItem key={b}>{b}</SelectItem>
              ))}
            </Select>
            
            <Input
              type="password"
              label="Password"
              placeholder="Create a strong password"
              variant="bordered"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              startContent={<Lock size={18} className="text-default-400" />}
              isRequired
            />
            
            <Button 
              color="primary" 
              type="submit" 
              className="w-full mt-4"
              isLoading={isLoading}
            >
              Sign Up
            </Button>
          </form>
          
          <Divider className="my-6" />
          
          <div className="text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
