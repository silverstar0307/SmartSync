'use client'

import React, { useState, useEffect } from 'react'
import { Input, Button, Card, CardBody, CardHeader, Divider } from '@nextui-org/react'
import { Mail, Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-default-50 p-4">
        <Card className="w-full max-w-md p-6 flex flex-col items-center justify-center min-h-[450px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </Card>
      </div>
    )
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await api.post('/auth/forgot-password', {
        email,
        password,
        confirmPassword
      })
      
      setSuccess(response.data?.message || 'Password changed successfully! Redirecting to login...')
      
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password. Please check your details.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-default-50 p-4">
      <Card className="w-full max-w-md p-6">
        <CardHeader className="flex flex-col gap-1 items-center mb-4">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-2">S</div>
          <h2 className="text-2xl font-bold">Reset Password</h2>
          <p className="text-default-500 text-center">Enter your email and your new password details</p>
        </CardHeader>
        
        <CardBody>
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-success/10 border border-success/30 text-success p-3 rounded-lg mb-4 text-sm">
              {success}
            </div>
          )}
          
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <Input
              type="email"
              label="Email"
              placeholder="Enter your email address"
              variant="bordered"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              startContent={<Mail size={18} className="text-default-400" />}
              isRequired
              disabled={isLoading || !!success}
            />
            
            <Input
              type="password"
              label="New Password"
              placeholder="Enter new password"
              variant="bordered"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              startContent={<Lock size={18} className="text-default-400" />}
              isRequired
              disabled={isLoading || !!success}
            />
            
            <Input
              type="password"
              label="Confirm Password"
              placeholder="Confirm new password"
              variant="bordered"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              startContent={<Lock size={18} className="text-default-400" />}
              isRequired
              disabled={isLoading || !!success}
            />
            
            <Button 
              color="primary" 
              type="submit" 
              className="w-full mt-2 font-semibold"
              isLoading={isLoading}
              disabled={isLoading || !!success}
            >
              Change Password
            </Button>
          </form>
          
          <Divider className="my-6" />
          
          <div className="text-center text-sm">
            Remembered your password?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
