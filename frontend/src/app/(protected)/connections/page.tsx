'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardBody, Button, Input, Chip, Avatar, Spinner } from '@nextui-org/react'
import { Send, Bot, User, Sparkles, Briefcase, MapPin, Building, ArrowRight, Zap, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store/authSlice'
import { getAiRecommendedInternships, RecommendedInternship } from '@/lib/internshipData'

interface Message {
  role: 'ai' | 'user'
  content: string
  type?: 'text' | 'recommendations'
  recommendations?: RecommendedInternship[]
}

export default function AiRecPage() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: `Hi ${user?.first_name || 'there'}! I'm your AI Career Assistant. I scan active requisitions across top engineering companies (Google, Meta, NVIDIA, Amazon, Intel, Tesla, and more) to find personalized internships matching your skills. What kind of opportunity are you looking for?`,
      type: 'text'
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const processUserQuery = (query: string) => {
    if (!query.trim()) return

    setMessages(prev => [...prev, { role: 'user', content: query, type: 'text' }])
    setInputMessage('')
    setIsTyping(true)

    setTimeout(() => {
      setIsTyping(false)

      // Extract search keywords from query and user interests
      const tagsToMatch: string[] = []
      if (user?.interests && user.interests.length > 0) {
        tagsToMatch.push(...user.interests)
      }

      // Add query terms
      const queryWords = query.toLowerCase().split(/[\s,]+/)
      tagsToMatch.push(...queryWords)

      const recs = getAiRecommendedInternships(tagsToMatch).slice(0, 4)

      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          content: `Here are the top-ranked internship opportunities I found matching "${query}" and your profile:`,
          type: 'recommendations',
          recommendations: recs
        }
      ])
    }, 1000)
  }

  const handleSendMessage = () => {
    processUserQuery(inputMessage)
  }

  const handleApply = (id: string) => {
    setAppliedJobs(prev => ({ ...prev, [id]: true }))
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -m-6 bg-content1">
      <div className="p-6 border-b border-divider bg-gradient-to-r from-primary-50 via-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="text-primary" size={24} />
              AI Internship Match & Career Assistant
            </h1>
            <p className="text-default-500 mt-1 text-sm">
              Live AI analysis across tier-1 tech & engineering companies tailored to your skill tags.
            </p>
          </div>
          {user?.interests && user.interests.length > 0 && (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs text-default-500">Your profile tags:</span>
              <div className="flex gap-1">
                {user.interests.slice(0, 3).map((tag: string) => (
                  <Chip key={tag} size="sm" variant="flat" color="primary" className="text-[10px]">
                    {tag}
                  </Chip>
                ))}
                {user.interests.length > 3 && (
                  <Chip size="sm" variant="flat" className="text-[10px]">
                    +{user.interests.length - 3}
                  </Chip>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-default-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="flex items-start gap-3 max-w-[85%]">
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shrink-0 mt-1 shadow-md">
                  <Bot size={16} />
                </div>
              )}

              <div
                className={`p-4 rounded-2xl shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-background border border-divider rounded-tl-sm'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>

                {msg.type === 'recommendations' && msg.recommendations && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                    {msg.recommendations.map(rec => {
                      const isApplied = !!appliedJobs[rec.id]
                      return (
                        <Card key={rec.id} className="border border-divider shadow-sm hover:border-primary/50 transition-colors">
                          <CardBody className="p-4 gap-3">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-lg ${rec.logoBg} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                                  {rec.company.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <h3 className="font-bold text-sm text-foreground line-clamp-1">{rec.title}</h3>
                                  <div className="flex items-center gap-1.5 text-xs text-default-500 mt-0.5">
                                    <Building size={12} /> {rec.company}
                                  </div>
                                </div>
                              </div>
                              <Chip color={rec.matchScore >= 85 ? 'success' : 'primary'} variant="flat" size="sm" className="font-bold text-[11px]">
                                {rec.matchScore}% Match
                              </Chip>
                            </div>

                            <p className="text-xs text-default-500 line-clamp-2">{rec.description}</p>

                            <div className="flex items-center gap-3 text-xs text-default-500">
                              <span className="flex items-center gap-1"><MapPin size={11} /> {rec.location}</span>
                              <span className="flex items-center gap-1 font-semibold text-foreground"><Briefcase size={11} /> {rec.stipend}</span>
                            </div>

                            <div className="flex flex-wrap gap-1 mt-1">
                              {rec.skills.map((skill: string) => (
                                <Chip key={skill} size="sm" variant="flat" className="text-[10px] h-5">
                                  {skill}
                                </Chip>
                              ))}
                            </div>

                            <Button
                              size="sm"
                              color={isApplied ? 'success' : 'primary'}
                              variant={isApplied ? 'flat' : 'solid'}
                              className="mt-2 w-full font-medium"
                              onClick={() => handleApply(rec.id)}
                              disabled={isApplied}
                              endContent={isApplied ? <CheckCircle2 size={14} /> : <ArrowRight size={14} />}
                            >
                              {isApplied ? 'Application Sent' : 'Apply Directly'}
                            </Button>
                          </CardBody>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <Avatar
                  name={user?.first_name?.charAt(0)}
                  src={user?.profile_photo}
                  className="w-8 h-8 shrink-0 mt-1"
                  color="primary"
                />
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shrink-0 shadow-md">
              <Bot size={16} />
            </div>
            <div className="bg-background border border-divider rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2 text-xs text-default-400">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
              <span>Searching company databases...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-6 py-2 bg-background border-t border-divider flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-default-400 shrink-0 font-medium flex items-center gap-1">
          <Zap size={12} className="text-yellow-500" /> Suggestions:
        </span>
        <button
          onClick={() => processUserQuery('Recommend internships based on my selected interest tags')}
          className="px-2.5 py-1 rounded-full bg-default-100 hover:bg-default-200 text-default-700 whitespace-nowrap transition-colors"
        >
          🎯 Based on my saved interests
        </button>
        <button
          onClick={() => processUserQuery('Find Remote Web Development and React internships')}
          className="px-2.5 py-1 rounded-full bg-default-100 hover:bg-default-200 text-default-700 whitespace-nowrap transition-colors"
        >
          💻 Remote React & Web Dev
        </button>
        <button
          onClick={() => processUserQuery('Find Machine Learning and AI internships at NVIDIA or OpenAI')}
          className="px-2.5 py-1 rounded-full bg-default-100 hover:bg-default-200 text-default-700 whitespace-nowrap transition-colors"
        >
          🤖 AI & Machine Learning
        </button>
        <button
          onClick={() => processUserQuery('Find VLSI and Embedded Hardware internships')}
          className="px-2.5 py-1 rounded-full bg-default-100 hover:bg-default-200 text-default-700 whitespace-nowrap transition-colors"
        >
          ⚡ VLSI & Embedded Systems
        </button>
      </div>

      <div className="p-4 bg-background border-t border-divider">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Input
            placeholder="Type your skills or ask for company internships (e.g., 'Find Python & Cloud roles')..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
            size="lg"
            radius="lg"
            classNames={{
              inputWrapper:
                'bg-default-100 border-transparent hover:bg-default-200 focus-within:bg-default-100 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
            }}
          />
          <Button
            color="primary"
            size="lg"
            isIconOnly
            radius="lg"
            onClick={handleSendMessage}
            isDisabled={!inputMessage.trim() || isTyping}
            className="shadow-md bg-gradient-to-r from-primary to-purple-600"
          >
            <Send size={20} />
          </Button>
        </div>
      </div>
    </div>
  )
}
