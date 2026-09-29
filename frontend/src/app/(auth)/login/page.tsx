'use client'

import React, { useState, useEffect } from 'react'
import { Input, Button, Card, CardBody, CardHeader, Divider } from '@nextui-org/react'
import { Mail, Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authSlice'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      <div className="min-h-screen flex items-center justify-center bg-default-50 p-4">
        <Card className="w-full max-w-md p-6 flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </Card>
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const response = await api.post('/auth/login', { email, password })
      login(response.data.user, response.data.token)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-default-50 p-4">
      <Card className="w-full max-w-md p-6">
        <CardHeader className="flex flex-col gap-1 items-center mb-4">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-2">S</div>
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <p className="text-default-500">Sign in to your account to continue</p>
        </CardHeader>
        
        <CardBody>
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input
              type="email"
              label="Email"
              placeholder="Enter your email"
              variant="bordered"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              startContent={<Mail size={18} className="text-default-400" />}
              isRequired
            />
            
            <Input
              type="password"
              label="Password"
              placeholder="Enter your password"
              variant="bordered"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              startContent={<Lock size={18} className="text-default-400" />}
              isRequired
            />
            
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            
            <Button 
              color="primary" 
              type="submit" 
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>
          
          <Divider className="my-6" />
          
          <div className="text-center text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
