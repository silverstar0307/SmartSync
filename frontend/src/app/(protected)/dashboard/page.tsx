'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader, Chip, Avatar, Button, Progress } from '@nextui-org/react'
import { TrendingUp, Briefcase, Globe, AlertTriangle, Clock, ArrowUpRight, Building2, ChevronRight } from 'lucide-react'

export default function DashboardPage() {
  const [time, setTime] = useState(new Date())

  // Simulate real-time clock for dashboard
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const newsItems = [
    { title: "Tech Giants Announce AI Hiring Spree for Q4", source: "TechCrunch", time: "10 mins ago", type: "Positive" },
    { title: "Remote Work Policies Standardized Across Top 50 Companies", source: "Forbes", time: "1 hour ago", type: "Neutral" },
    { title: "Global Supply Chain Disruptions Affect Hardware Startups", source: "Bloomberg", time: "3 hours ago", type: "Negative" },
    { title: "New European AI Act Impacts Software Internships", source: "Reuters", time: "5 hours ago", type: "Neutral" }
  ]

  const jobMarketData = [
    { role: "Frontend Developer", demand: 85, trend: "up", activeJobs: "12,450" },
    { role: "Data Scientist", demand: 92, trend: "up", activeJobs: "8,320" },
    { role: "UI/UX Designer", demand: 65, trend: "down", activeJobs: "4,100" },
    { role: "Cloud Engineer", demand: 88, trend: "up", activeJobs: "9,600" }
  ]

  const urgentInternships = [
    { company: "Microsoft", role: "Software Engineering Intern", location: "Seattle, WA", posted: "2 hours ago" },
    { company: "Tesla", role: "AI Research Intern", location: "Palo Alto, CA", posted: "5 hours ago" },
    { company: "Spotify", role: "Data Engineering Intern", location: "Remote", posted: "1 day ago" }
  ]

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Market Dashboard</h1>
          <p className="text-default-500 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
            Live Corporate Insights & Opportunities
          </p>
        </div>
        <div className="text-right bg-content1 px-4 py-2 rounded-xl border border-divider shadow-sm">
          <p className="text-xs text-default-400 font-bold uppercase tracking-wider">Live Time</p>
          <p className="font-mono font-semibold text-lg">{time.toLocaleTimeString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMN 1 & 2: Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Real-time Global News */}
          <Card className="shadow-md border border-divider">
            <CardHeader className="flex justify-between items-center px-6 pt-6 pb-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Globe className="text-primary" size={22} />
                Global Corporate News
              </h2>
              <Button size="sm" variant="light" color="primary" endContent={<ChevronRight size={16}/>}>View All</Button>
            </CardHeader>
            <CardBody className="px-6 pb-6 gap-4">
              {newsItems.map((news, idx) => (
                <div key={idx} className="flex flex-col gap-2 p-4 bg-default-50 rounded-xl border border-divider/50 hover:bg-default-100 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                      {news.title}
                    </h3>
                    <Chip 
                      size="sm" 
                      variant="flat" 
                      color={news.type === 'Positive' ? 'success' : news.type === 'Negative' ? 'danger' : 'default'}
                      className="shrink-0"
                    >
                      {news.type}
                    </Chip>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-default-500 font-medium">
                    <span className="flex items-center gap-1"><Building2 size={14} /> {news.source}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {news.time}</span>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Job Availability / Trends */}
          <Card className="shadow-md border border-divider">
            <CardHeader className="px-6 pt-6 pb-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="text-secondary" size={22} />
                Job Availability & Market Demand
              </h2>
            </CardHeader>
            <CardBody className="px-6 pb-6 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobMarketData.map((data, idx) => (
                  <div key={idx} className="p-4 border border-divider rounded-xl">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-sm">{data.role}</h4>
                      <Chip size="sm" color={data.trend === 'up' ? 'success' : 'danger'} variant="dot" className="border-none">
                        {data.activeJobs} Jobs
                      </Chip>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress 
                        value={data.demand} 
                        color={data.demand > 80 ? "success" : data.demand > 50 ? "warning" : "danger"}
                        className="flex-1"
                        size="sm"
                      />
                      <span className="text-xs font-bold w-10 text-right">{data.demand}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* COLUMN 3: Side panels (Crises, Internships) */}
        <div className="flex flex-col gap-6">
          
          {/* Latest Crises / Alerts */}
          <Card className="bg-danger-50 border-danger-200 shadow-md">
            <CardHeader className="px-5 pt-5 pb-0">
              <h2 className="text-lg font-bold text-danger-700 flex items-center gap-2">
                <AlertTriangle size={20} />
                Industry Alerts
              </h2>
            </CardHeader>
            <CardBody className="px-5 pb-5 pt-4 gap-3">
              <div className="p-3 bg-white/60 rounded-lg border border-danger-100">
                <h4 className="font-bold text-sm text-foreground">Tech Layoffs Impact Mid-Level Devs</h4>
                <p className="text-xs text-default-600 mt-1">Several mid-cap companies announce restructuring, causing a temporary freeze in mid-level hiring. Entry-level remains stable.</p>
              </div>
              <div className="p-3 bg-white/60 rounded-lg border border-danger-100">
                <h4 className="font-bold text-sm text-foreground">Web3 Funding Winter Continues</h4>
                <p className="text-xs text-default-600 mt-1">Venture capital investment in crypto startups drops by 30% this quarter, limiting new internship roles in this sector.</p>
              </div>
            </CardBody>
          </Card>

          {/* Urgent Internships */}
          <Card className="shadow-md border border-divider flex-1">
            <CardHeader className="px-5 pt-5 pb-2">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Briefcase className="text-primary" size={20} />
                Just Posted Internships
              </h2>
            </CardHeader>
            <CardBody className="px-5 pb-5 gap-4">
              {urgentInternships.map((internship, idx) => (
                <div key={idx} className="flex flex-col gap-2 pb-3 border-b border-divider last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm leading-tight">{internship.role}</h4>
                    <Button isIconOnly size="sm" variant="light" className="h-6 w-6 min-w-0 shrink-0">
                      <ArrowUpRight size={14} className="text-default-400" />
                    </Button>
                  </div>
                  <p className="text-xs font-semibold text-primary">{internship.company}</p>
                  <div className="flex justify-between items-center text-xs text-default-500">
                    <span>{internship.location}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {internship.posted}</span>
                  </div>
                </div>
              ))}
              
              <Button color="primary" variant="flat" className="w-full font-semibold mt-2">
                View All Opportunities
              </Button>
            </CardBody>
          </Card>

        </div>
      </div>
    </div>
  )
}
