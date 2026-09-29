'use client'

import React from 'react'
import { Button, Card, CardBody } from '@nextui-org/react'
import { Sparkles, Users, MessageSquare, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-default-50 flex flex-col justify-between">
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white text-xl font-bold">
            S
          </div>
          <span className="text-xl font-bold text-foreground">Smart Sync</span>
        </div>
        <div className="flex gap-4">
          <Button as={Link} href="/login" variant="light" color="primary">
            Log In
          </Button>
          <Button as={Link} href="/signup" color="primary">
            Sign Up
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 py-12">
        <div className="flex-1 flex flex-col gap-6 text-center lg:text-left items-center lg:items-start">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles size={16} />
            AI-Powered College Community
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            Connect with peers who share your <span className="text-primary bg-clip-text">passions</span>
          </h1>
          <p className="text-lg text-default-500 max-w-xl">
            Smart Sync connects college students based on shared interests and domains. Find communities, collaborate on projects, and build your campus network.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button as={Link} href="/signup" color="primary" size="lg" endContent={<ArrowRight size={18} />}>
              Get Started
            </Button>
            <Button as={Link} href="/login" variant="bordered" size="lg">
              Explore Dashboard
            </Button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg lg:max-w-none">
          <Card className="p-4 hover:-translate-y-1 transition-transform border-none shadow-sm">
            <CardBody className="gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <Users size={20} />
              </div>
              <h3 className="font-bold text-lg">AI Peer Matching</h3>
              <p className="text-sm text-default-500">
                Get matched with college students sharing your exact interests and coding domains.
              </p>
            </CardBody>
          </Card>

          <Card className="p-4 hover:-translate-y-1 transition-transform border-none shadow-sm">
            <CardBody className="gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center">
                <MessageSquare size={20} />
              </div>
              <h3 className="font-bold text-lg">Active Clubs</h3>
              <p className="text-sm text-default-500">
                Join or start student-led interest groups, from development to creative arts.
              </p>
            </CardBody>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-divider py-8 text-center text-sm text-default-400">
        <p>© 2026 Smart Sync. Designed for college students.</p>
      </footer>
    </div>
  )
}
