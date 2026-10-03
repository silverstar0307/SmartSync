'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Progress,
  Spinner,
  Badge,
  Tooltip
} from '@nextui-org/react'
import {
  Plus,
  Search,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Briefcase,
  Building2,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  Bookmark,
  Zap,
  Bot,
  ExternalLink,
  SlidersHorizontal,
  DollarSign
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authSlice'
import { INTEREST_TAXONOMY, getAllPredefinedInterests, InterestCategory } from '@/lib/interestsData'
import { getAiRecommendedInternships, RecommendedInternship } from '@/lib/internshipData'

export default function InterestsPage() {
  const { user, updateUser } = useAuthStore()
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // AI Recommendation State
  const [isSearchingAi, setIsSearchingAi] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchResults, setSearchResults] = useState<RecommendedInternship[]>([])
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({})
  const [savedJobs, setSavedJobs] = useState<Record<string, boolean>>({})
  const [filterQuery, setFilterQuery] = useState('')
  const [selectedJob, setSelectedJob] = useState<RecommendedInternship | null>(null)

  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const resultsRef = useRef<HTMLDivElement>(null)

  // Track expanded domains (e.g. { 'Coding': true, 'VLSI': true })
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({
    'Coding': true,
    'Web Development': true
  })

  useEffect(() => {
    if (user?.id) {
      const fetchUser = async () => {
        try {
          const res = await api.get(`/users/${user.id}`)
          const interests = res.data.interests || []
          setSelectedInterests(interests)
          if (interests.length > 0) {
            // Initial AI recommendations based on existing interests
            const recs = getAiRecommendedInternships(interests)
            setSearchResults(recs)
          }
        } catch (err) {
          console.error(err)
        }
      }
      fetchUser()
    }
  }, [user])

  // Automatically expand domain if searchQuery matches any of its sub-domains or domain name
  useEffect(() => {
    if (!searchQuery.trim()) return

    const queryLower = searchQuery.toLowerCase().trim()
    const autoExpanded: Record<string, boolean> = {}

    INTEREST_TAXONOMY.forEach(cat => {
      cat.domains.forEach(dom => {
        if (dom.subDomains) {
          const domainMatches = dom.name.toLowerCase().includes(queryLower)
          const subMatches = dom.subDomains.some(s => s.toLowerCase().includes(queryLower))
          if (domainMatches || subMatches) {
            autoExpanded[dom.name] = true
          }
        }
      })
    })

    setExpandedDomains(prev => ({ ...prev, ...autoExpanded }))
  }, [searchQuery])

  const toggleExpand = (domainName: string) => {
    setExpandedDomains(prev => ({
      ...prev,
      [domainName]: !prev[domainName]
    }))
  }

  // Toggle a single interest (e.g., "Coding: C++" or "Singing")
  const toggleInterest = (interest: string) => {
    const exists = selectedInterests.some(i => i.toLowerCase() === interest.toLowerCase())
    let updated: string[] = []
    if (exists) {
      updated = selectedInterests.filter(i => i.toLowerCase() !== interest.toLowerCase())
    } else {
      updated = [...selectedInterests, interest]
    }
    setSelectedInterests(updated)

    // If user has already searched, live-update AI match ranks
    if (hasSearched) {
      const newRecs = getAiRecommendedInternships(updated)
      setSearchResults(newRecs)
    }
  }

  // Toggle all sub-domains under a domain
  const toggleAllSubDomains = (domainName: string, subDomains: string[]) => {
    const formattedSubs = subDomains.map(sub => `${domainName}: ${sub}`)
    const allSelected = formattedSubs.every(sub =>
      selectedInterests.some(i => i.toLowerCase() === sub.toLowerCase())
    )

    let updated: string[] = []
    if (allSelected) {
      updated = selectedInterests.filter(i => !formattedSubs.some(sub => sub.toLowerCase() === i.toLowerCase()))
    } else {
      const newItems = formattedSubs.filter(
        sub => !selectedInterests.some(i => i.toLowerCase() === sub.toLowerCase())
      )
      updated = [...selectedInterests, ...newItems]
    }
    setSelectedInterests(updated)

    if (hasSearched) {
      const newRecs = getAiRecommendedInternships(updated)
      setSearchResults(newRecs)
    }
  }

  const handleSave = async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const res = await api.put(`/users/${user.id}/interests`, { interests: selectedInterests })
      updateUser({ interests: res.data.interests })
      alert('Interests saved successfully!')
    } catch (err) {
      console.error(err)
      alert('Failed to save interests.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCustomInterest = () => {
    const trimmed = searchQuery.trim()
    if (!trimmed) return

    const alreadySelected = selectedInterests.some(
      i => i.toLowerCase() === trimmed.toLowerCase()
    )
    if (alreadySelected) {
      setSearchQuery('')
      return
    }

    const updated = [...selectedInterests, trimmed]
    setSelectedInterests(updated)
    setSearchQuery('')

    if (hasSearched) {
      setSearchResults(getAiRecommendedInternships(updated))
    }
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all selected interests?')) {
      setSelectedInterests([])
      if (hasSearched) {
        setSearchResults(getAiRecommendedInternships([]))
      }
    }
  }

  // Trigger AI Search
  const handleAiSearch = () => {
    if (selectedInterests.length === 0) {
      alert('Please select at least one interest tag first so AI can find matching internships among companies!')
      return
    }

    setIsSearchingAi(true)

    // Simulate AI scanning companies and evaluating skill vectors
    setTimeout(() => {
      const recs = getAiRecommendedInternships(selectedInterests)
      setSearchResults(recs)
      setIsSearchingAi(false)
      setHasSearched(true)

      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }, 700)
  }

  const handleApplyClick = (job: RecommendedInternship) => {
    setSelectedJob(job)
    onOpen()
  }

  const confirmApply = () => {
    if (!selectedJob) return
    setAppliedJobs(prev => ({ ...prev, [selectedJob.id]: true }))
  }

  const toggleSaveJob = (id: string) => {
    setSavedJobs(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const allPredefined = useMemo(() => getAllPredefinedInterests(), [])

  // Filter categories and domains based on search query
  const filteredTaxonomy = useMemo(() => {
    if (!searchQuery.trim()) return INTEREST_TAXONOMY

    const q = searchQuery.toLowerCase().trim()
    return INTEREST_TAXONOMY.map(cat => {
      const filteredDomains = cat.domains.filter(dom => {
        const domNameMatch = dom.name.toLowerCase().includes(q)
        const subMatch = dom.subDomains?.some(s => s.toLowerCase().includes(q))
        return domNameMatch || subMatch
      })

      return {
        ...cat,
        domains: filteredDomains
      }
    }).filter(cat => cat.domains.length > 0)
  }, [searchQuery])

  // Custom interests not present in standard taxonomy
  const customInterests = useMemo(() => {
    return selectedInterests.filter(interest => {
      const cleanName = interest.includes(': ') ? interest.split(': ')[1] : interest
      return !allPredefined.some(p => p.toLowerCase() === interest.toLowerCase() || p.toLowerCase() === cleanName.toLowerCase())
    })
  }, [selectedInterests, allPredefined])

  const filteredCustom = useMemo(() => {
    if (!searchQuery.trim()) return customInterests
    return customInterests.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase().trim()))
  }, [customInterests, searchQuery])

  const isSearchQueryCustom = searchQuery.trim() !== '' &&
    !allPredefined.some(p => p.toLowerCase() === searchQuery.trim().toLowerCase()) &&
    !customInterests.some(c => c.toLowerCase() === searchQuery.trim().toLowerCase())

  const getDomainSelectedCount = (domainName: string, subDomains: string[]) => {
    const formattedSubs = subDomains.map(s => `${domainName}: ${s}`)
    return selectedInterests.filter(i =>
      formattedSubs.some(sub => sub.toLowerCase() === i.toLowerCase()) ||
      i.toLowerCase() === domainName.toLowerCase()
    ).length
  }

  // Filtered recommendations by company/role filter
  const displayedRecommendations = useMemo(() => {
    if (!filterQuery.trim()) return searchResults
    const f = filterQuery.toLowerCase()
    return searchResults.filter(
      r =>
        r.company.toLowerCase().includes(f) ||
        r.title.toLowerCase().includes(f) ||
        r.skills.some(s => s.toLowerCase().includes(f)) ||
        r.location.toLowerCase().includes(f)
    )
  }, [searchResults, filterQuery])

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-16">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-900 via-indigo-900 to-purple-900 text-white p-8 shadow-xl border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-primary-200 text-xs font-semibold mb-3 border border-white/10">
              <Zap size={14} className="text-yellow-400 fill-yellow-400" />
              AI-Powered Match Engine
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Select Your Interests & Discover Top Internships
            </h1>
            <p className="text-primary-100/80 mt-2 text-sm md:text-base leading-relaxed">
              Select your skill tags below. Our AI scans real-time company openings across Google, Microsoft, NVIDIA, Meta, and more to recommend the best matching internships.
            </p>
          </div>

          <div className="shrink-0 flex flex-col gap-2">
            <Button
              color="primary"
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg text-base px-6 h-12 hover:scale-105 active:scale-95 transition-all"
              onClick={handleAiSearch}
              isLoading={isSearchingAi}
              startContent={!isSearchingAi && <Sparkles className="animate-spin text-yellow-300" size={20} />}
            >
              {isSearchingAi ? 'AI Matching...' : 'Search Internships'}
            </Button>
            <span className="text-xs text-center text-primary-200/70">
              {selectedInterests.length} interest tags selected
            </span>
          </div>
        </div>

        {/* Background glow decoration */}
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Grid: Left (Interests Explorer) & Right (Selected Summary + Search CTA) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Domain & Sub-Domain Explorer */}
        <Card className="lg:col-span-2 shadow-md border border-divider">
          <CardBody className="p-6 gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Explore Interest Domains
                </h3>
                <span className="text-xs text-default-400">Click tags to select/deselect</span>
              </div>
              <Input
                placeholder="Search domain or sub-interest (e.g. Python, React, VLSI, CAD, AWS)..."
                startContent={<Search size={18} className="text-default-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                isClearable
                onClear={() => setSearchQuery('')}
                className="w-full"
              />
            </div>

            {/* Custom Interest Prompt */}
            {isSearchQueryCustom && (
              <div className="p-4 border border-primary-200 rounded-xl bg-primary-50/50 flex items-center justify-between animate-fade-in">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-primary-700">Can't find your interest?</span>
                  <span className="text-xs text-primary-600">Add "{searchQuery.trim()}" as a custom interest tag.</span>
                </div>
                <Button
                  size="sm"
                  color="primary"
                  variant="solid"
                  startContent={<Plus size={16} />}
                  onClick={handleAddCustomInterest}
                >
                  Add Custom
                </Button>
              </div>
            )}

            {/* Category & Domain Tree */}
            <div className="flex flex-col gap-8">
              {filteredTaxonomy.map(cat => (
                <div key={cat.category} className="flex flex-col gap-3">
                  {/* Category Header */}
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${cat.bgClass}`} />
                    <h4 className="text-xs font-bold text-default-600 uppercase tracking-wider">
                      {cat.category}
                    </h4>
                  </div>

                  {/* Domains List */}
                  <div className="flex flex-col gap-3 pl-2 border-l-2 border-default-100">
                    {cat.domains.map(dom => {
                      const hasSubDomains = dom.subDomains && dom.subDomains.length > 0
                      const isExpanded = !!expandedDomains[dom.name]
                      const selectedCount = hasSubDomains ? getDomainSelectedCount(dom.name, dom.subDomains!) : 0
                      const isDomainDirectlySelected = selectedInterests.some(i => i.toLowerCase() === dom.name.toLowerCase())

                      if (!hasSubDomains) {
                        return (
                          <div key={dom.name} className="flex items-center gap-2">
                            <Chip
                              color={isDomainDirectlySelected ? cat.color : 'default'}
                              variant={isDomainDirectlySelected ? 'solid' : 'flat'}
                              onClick={() => toggleInterest(dom.name)}
                              startContent={isDomainDirectlySelected ? <Check size={14} className="ml-1" /> : <Plus size={14} className="ml-1" />}
                              className="p-3 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 duration-150 font-medium"
                            >
                              {dom.name}
                            </Chip>
                          </div>
                        )
                      }

                      // Expandable Domain with Sub-Interests
                      const allSubsSelected = dom.subDomains!.every(sub =>
                        selectedInterests.some(i => i.toLowerCase() === `${dom.name}: ${sub}`.toLowerCase())
                      )

                      return (
                        <div
                          key={dom.name}
                          className="flex flex-col rounded-xl border border-default-200/80 bg-default-50/50 overflow-hidden transition-all duration-200 hover:border-default-300"
                        >
                          {/* Domain Header */}
                          <div className="p-3 flex items-center justify-between gap-3 bg-content1">
                            <div
                              className="flex items-center gap-2 flex-1 cursor-pointer select-none"
                              onClick={() => toggleExpand(dom.name)}
                            >
                              <div className="p-1 rounded-md bg-default-100 text-default-600">
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                              <span className="font-semibold text-small text-default-800">
                                {dom.name}
                              </span>

                              {selectedCount > 0 && (
                                <Chip size="sm" color={cat.color} variant="solid" className="h-5 text-[11px] font-bold">
                                  {selectedCount} selected
                                </Chip>
                              )}

                              <span className="text-xs text-default-400">
                                ({dom.subDomains!.length} sub-interests)
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                variant="light"
                                color={allSubsSelected ? 'danger' : cat.color}
                                className="h-7 text-xs font-medium px-2"
                                onClick={() => toggleAllSubDomains(dom.name, dom.subDomains!)}
                              >
                                {allSubsSelected ? 'Deselect All' : 'Select All'}
                              </Button>
                              <Button
                                size="sm"
                                variant={isExpanded ? 'flat' : 'light'}
                                color={isExpanded ? cat.color : 'default'}
                                className="h-7 text-xs px-2"
                                onClick={() => toggleExpand(dom.name)}
                              >
                                {isExpanded ? 'Hide' : 'Expand'}
                              </Button>
                            </div>
                          </div>

                          {/* Sub-Interests */}
                          {isExpanded && (
                            <div className="p-4 border-t border-default-200/60 bg-background/50 flex flex-col gap-2.5 animate-in fade-in duration-150">
                              <span className="text-xs font-semibold text-default-400 uppercase tracking-wider mb-1">
                                Choose Sub-Interests under {dom.name}:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {dom.subDomains!.map(sub => {
                                  const fullSubInterest = `${dom.name}: ${sub}`
                                  const isSelected = selectedInterests.some(
                                    i => i.toLowerCase() === fullSubInterest.toLowerCase()
                                  )

                                  return (
                                    <Chip
                                      key={sub}
                                      color={isSelected ? cat.color : 'default'}
                                      variant={isSelected ? 'solid' : 'flat'}
                                      onClick={() => toggleInterest(fullSubInterest)}
                                      startContent={isSelected ? <Check size={12} className="ml-1" /> : <Plus size={12} className="ml-1" />}
                                      className="p-2.5 cursor-pointer transition-transform hover:scale-105 active:scale-95 duration-150 text-xs font-medium"
                                    >
                                      {sub}
                                    </Chip>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Custom Interests Section */}
              {filteredCustom.length > 0 && (
                <div className="flex flex-col gap-2 pt-4 border-t border-divider">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-default-400" />
                    <h4 className="text-xs font-bold text-default-600 uppercase tracking-wider">
                      Custom Interests
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-2">
                    {filteredCustom.map(interest => (
                      <Chip
                        key={interest}
                        color="default"
                        variant="solid"
                        onClose={() => toggleInterest(interest)}
                        className="p-3 cursor-pointer"
                      >
                        {interest}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}

              {filteredTaxonomy.length === 0 && filteredCustom.length === 0 && (
                <div className="text-center py-12 text-default-400 flex flex-col items-center gap-2">
                  <Sparkles className="w-8 h-8 text-default-300" />
                  <p>No matching predefined or custom interest domains found.</p>
                  <p className="text-xs text-default-400">Type above to add "{searchQuery}" as a custom interest.</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Right Column: Selected Interests Summary & Actions */}
        <div className="flex flex-col gap-6">
          <Card className="shadow-md border border-divider sticky top-6">
            <CardBody className="p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">Selected Tags</h3>
                  <Chip size="sm" color="primary" variant="solid" className="font-bold">
                    {selectedInterests.length}
                  </Chip>
                </div>
                {selectedInterests.length > 0 && (
                  <Button
                    size="sm"
                    color="danger"
                    variant="light"
                    startContent={<Trash2 size={14} />}
                    onClick={handleClearAll}
                    className="h-7 px-2 text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Selected List Chips */}
              <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-1">
                {selectedInterests.map(interest => {
                  let matchedCategory: InterestCategory | undefined

                  if (interest.includes(': ')) {
                    const [domName] = interest.split(': ')
                    matchedCategory = INTEREST_TAXONOMY.find(cat =>
                      cat.domains.some(d => d.name.toLowerCase() === domName.toLowerCase())
                    )
                  } else {
                    matchedCategory = INTEREST_TAXONOMY.find(cat =>
                      cat.domains.some(d => d.name.toLowerCase() === interest.toLowerCase())
                    )
                  }

                  const chipColor = matchedCategory ? matchedCategory.color : 'default'

                  return (
                    <Chip
                      key={interest}
                      onClose={() => toggleInterest(interest)}
                      color={chipColor}
                      variant="flat"
                      className="transition-all text-xs font-semibold"
                    >
                      {interest}
                    </Chip>
                  )
                })}

                {selectedInterests.length === 0 && (
                  <div className="p-5 text-center text-default-400 border border-dashed border-default-200 rounded-xl w-full">
                    <Bot className="w-8 h-8 mx-auto mb-2 text-default-300" />
                    <p className="text-sm font-medium">No interest tags selected</p>
                    <p className="text-xs text-default-400 mt-1">
                      Pick skills on the left, then click <strong>"Search"</strong> to get AI recommendations!
                    </p>
                  </div>
                )}
              </div>

              {/* Primary AI Search Button */}
              <div className="flex flex-col gap-2.5 pt-3 border-t border-divider">
                <Button
                  color="secondary"
                  size="lg"
                  className="w-full font-bold shadow-lg bg-gradient-to-r from-primary to-purple-600 text-white text-base h-12"
                  onClick={handleAiSearch}
                  isLoading={isSearchingAi}
                  startContent={!isSearchingAi && <Sparkles size={18} className="text-yellow-300 animate-pulse" />}
                >
                  {isSearchingAi ? 'AI Searching Companies...' : 'Search Internships'}
                </Button>

                <Button
                  color="default"
                  variant="bordered"
                  size="md"
                  className="w-full font-semibold"
                  onClick={handleSave}
                  isLoading={isLoading}
                >
                  Save Interests to Profile
                </Button>
              </div>

              {/* Quick AI Tip */}
              <div className="p-3 rounded-xl bg-primary-50/60 border border-primary-100 flex items-start gap-2.5 text-xs text-primary-800">
                <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> Selecting specific sub-interests (e.g. <em>Next.js</em>, <em>AWS</em>, <em>VLSI</em>) produces higher match scores with hiring teams.
                </span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* AI RECOMMENDATIONS SECTION */}
      <div ref={resultsRef} id="ai-results" className="flex flex-col gap-6 pt-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-divider pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-gradient-to-tr from-primary to-purple-600 text-white shadow-sm">
                <Sparkles size={20} />
              </span>
              <h2 className="text-2xl font-bold tracking-tight">AI Internship Recommendations</h2>
              {hasSearched && (
                <Chip size="sm" color="success" variant="flat" className="font-bold">
                  {searchResults.length} Matches Found
                </Chip>
              )}
            </div>
            <p className="text-default-500 text-sm mt-1">
              Curated by AI based on your selected interest tags across top global tech and engineering companies.
            </p>
          </div>

          {/* Quick Filter */}
          <div className="w-full md:w-72">
            <Input
              placeholder="Filter by company, role, skill..."
              size="sm"
              startContent={<Search size={14} className="text-default-400" />}
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              isClearable
              onClear={() => setFilterQuery('')}
            />
          </div>
        </div>

        {/* Loading Spinner for Search */}
        {isSearchingAi && (
          <div className="py-16 flex flex-col items-center justify-center gap-4 bg-content1 rounded-2xl border border-divider">
            <Spinner size="lg" color="primary" />
            <div className="text-center">
              <p className="font-bold text-base">AI is scanning company requisitions...</p>
              <p className="text-xs text-default-400 mt-1">
                Comparing your selected tags ({selectedInterests.slice(0, 4).join(', ')}
                {selectedInterests.length > 4 ? ` +${selectedInterests.length - 4} more` : ''}) with active job openings
              </p>
            </div>
          </div>
        )}

        {/* Initial Prompt State (before user clicks Search and has no results) */}
        {!isSearchingAi && !hasSearched && searchResults.length === 0 && (
          <div className="p-12 text-center bg-content1 rounded-3xl border border-dashed border-default-200 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary flex items-center justify-center shadow-inner">
              <Sparkles size={32} />
            </div>
            <div className="max-w-md">
              <h3 className="text-lg font-bold">Ready to Find Your Dream Internship?</h3>
              <p className="text-sm text-default-500 mt-1">
                Select your skills and interests from the taxonomy above and click the <strong>"Search Internships"</strong> button to see AI recommendations tailored to your profile.
              </p>
            </div>
            <Button
              color="primary"
              className="font-bold px-6 bg-gradient-to-r from-primary to-purple-600 text-white"
              onClick={handleAiSearch}
              startContent={<Search size={16} />}
            >
              Search Internships Now
            </Button>
          </div>
        )}

        {/* Results Cards Grid */}
        {!isSearchingAi && displayedRecommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedRecommendations.map((job) => {
              const isApplied = !!appliedJobs[job.id]
              const isSaved = !!savedJobs[job.id]

              return (
                <Card
                  key={job.id}
                  className="border border-divider shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200 flex flex-col justify-between"
                >
                  <CardBody className="p-5 flex flex-col gap-4">
                    {/* Header: Company & Match Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl ${job.logoBg} text-white font-black text-sm flex items-center justify-center shadow-sm shrink-0`}
                        >
                          {job.company.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-default-500 uppercase tracking-wider">
                            {job.company}
                          </h4>
                          <span className="text-[11px] text-default-400">{job.type}</span>
                        </div>
                      </div>

                      {/* AI Match Score */}
                      <Chip
                        color={job.matchScore >= 85 ? 'success' : job.matchScore >= 70 ? 'primary' : 'warning'}
                        variant="flat"
                        size="sm"
                        className="font-extrabold text-xs"
                        startContent={<Zap size={12} className="ml-1" />}
                      >
                        {job.matchScore}% Match
                      </Chip>
                    </div>

                    {/* Role Title */}
                    <div>
                      <h3 className="font-bold text-base text-foreground line-clamp-1 hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-xs text-default-500 mt-1 line-clamp-2">
                        {job.description}
                      </p>
                    </div>

                    {/* AI Match Insight */}
                    <div className="p-2.5 rounded-lg bg-default-100/80 border border-default-200/50 text-[11px] text-default-600 flex items-start gap-2">
                      <Bot size={14} className="text-primary shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{job.aiInsight}</span>
                    </div>

                    {/* Meta info: Location, Stipend, Deadline */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-default-500 pt-1 border-t border-divider">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin size={13} className="text-default-400 shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate font-semibold text-foreground">
                        <DollarSign size={13} className="text-success shrink-0" />
                        <span className="truncate">{job.stipend}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Clock size={13} className="text-default-400 shrink-0" />
                        <span className="truncate">{job.duration}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate text-warning-600 font-medium">
                        <Clock size={13} className="shrink-0" />
                        <span className="truncate">{job.deadline}</span>
                      </div>
                    </div>

                    {/* Skills Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.skills.map((skill) => {
                        const isMatched = job.matchingTags.includes(skill)
                        return (
                          <Chip
                            key={skill}
                            size="sm"
                            variant={isMatched ? 'solid' : 'flat'}
                            color={isMatched ? 'primary' : 'default'}
                            className="text-[11px] h-6 font-medium"
                          >
                            {skill}
                          </Chip>
                        )
                      })}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-divider">
                      <Button
                        size="sm"
                        color={isApplied ? 'success' : 'primary'}
                        variant={isApplied ? 'flat' : 'solid'}
                        className="flex-1 font-semibold"
                        onClick={() => handleApplyClick(job)}
                        disabled={isApplied}
                        startContent={isApplied ? <CheckCircle2 size={14} /> : <ArrowRight size={14} />}
                      >
                        {isApplied ? 'Applied' : 'Apply Now'}
                      </Button>

                      <Tooltip content={isSaved ? 'Remove from saved' : 'Save opportunity'}>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color={isSaved ? 'primary' : 'default'}
                          onClick={() => toggleSaveJob(job.id)}
                        >
                          <Bookmark size={16} className={isSaved ? 'fill-primary' : ''} />
                        </Button>
                      </Tooltip>
                    </div>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        )}

        {/* Empty filter state */}
        {!isSearchingAi && displayedRecommendations.length === 0 && (hasSearched || searchResults.length > 0) && (
          <div className="text-center py-12 text-default-400">
            <p>No internships found matching "{filterQuery}".</p>
            <Button size="sm" variant="light" color="primary" onClick={() => setFilterQuery('')} className="mt-2">
              Clear Filter
            </Button>
          </div>
        )}
      </div>

      {/* Quick Application Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Briefcase className="text-primary" size={20} />
                  <span>Apply to {selectedJob?.company}</span>
                </div>
                <span className="text-xs font-normal text-default-500">
                  Role: {selectedJob?.title} &bull; {selectedJob?.location}
                </span>
              </ModalHeader>
              <ModalBody className="gap-4">
                <div className="p-3 bg-primary-50 rounded-xl border border-primary-100 text-xs text-primary-900 flex items-start gap-2">
                  <Bot size={16} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">AI Application Match: {selectedJob?.matchScore}%</span>
                    <p className="mt-0.5">
                      Your verified skills ({selectedJob?.matchingTags.join(', ') || 'profile tags'}) will be forwarded directly to {selectedJob?.company}'s campus talent team.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-default-600">Applicant Details</span>
                  <div className="p-3 bg-default-100 rounded-lg text-xs space-y-1">
                    <p><strong>Name:</strong> {user?.first_name} {user?.last_name || ''}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>College / Institution:</strong> {user?.college_name || 'SmartSync Verified University'}</p>
                    <p><strong>Stipend Offer:</strong> {selectedJob?.stipend}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-default-600">Cover Note to Recruiter (Optional)</span>
                  <Input
                    placeholder="Briefly state your passion and availability..."
                    defaultValue={`Hello ${selectedJob?.company} team, I am eager to apply for this internship to leverage my skills in ${selectedJob?.matchingTags.slice(0, 2).join(' & ') || 'engineering'}.`}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  className="font-bold"
                  onPress={() => {
                    confirmApply()
                    onClose()
                  }}
                  startContent={<CheckCircle2 size={16} />}
                >
                  Submit Application
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
