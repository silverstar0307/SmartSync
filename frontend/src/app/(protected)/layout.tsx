'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authSlice'
import { MainLayout } from '@/components/Layout/MainLayout'
import { Spinner } from '@nextui-org/react'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!isMounted || !isAuthenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  return <MainLayout>{children}</MainLayout>
}
