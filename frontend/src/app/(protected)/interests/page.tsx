'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardBody, Button, Chip, Input, Badge, Tooltip } from '@nextui-org/react'
import { Plus, Search, Check, Trash2, ChevronDown, ChevronUp, Layers, Sparkles, X } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authSlice'
import { INTEREST_TAXONOMY, getAllPredefinedInterests, InterestCategory } from '@/lib/interestsData'

export default function InterestsPage() {
  const { user, updateUser } = useAuthStore()
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Track expanded domains (e.g. { 'Coding': true, 'VLSI': true })
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (user?.id) {
      const fetchUser = async () => {
        try {
          const res = await api.get(`/users/${user.id}`)
          setSelectedInterests(res.data.interests || [])
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
    if (exists) {
      setSelectedInterests(prev => prev.filter(i => i.toLowerCase() !== interest.toLowerCase()))
    } else {
      setSelectedInterests(prev => [...prev, interest])
    }
  }

  // Toggle all sub-domains under a domain
  const toggleAllSubDomains = (domainName: string, subDomains: string[]) => {
    const formattedSubs = subDomains.map(sub => `${domainName}: ${sub}`)
    const allSelected = formattedSubs.every(sub =>
      selectedInterests.some(i => i.toLowerCase() === sub.toLowerCase())
    )

    if (allSelected) {
      // Deselect all sub-domains under this domain
      setSelectedInterests(prev =>
        prev.filter(i => !formattedSubs.some(sub => sub.toLowerCase() === i.toLowerCase()))
      )
    } else {
      // Select all sub-domains under this domain
      const newItems = formattedSubs.filter(
        sub => !selectedInterests.some(i => i.toLowerCase() === sub.toLowerCase())
      )
      setSelectedInterests(prev => [...prev, ...newItems])
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

    setSelectedInterests(prev => [...prev, trimmed])
    setSearchQuery('')
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all selected interests?')) {
      setSelectedInterests([])
    }
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

  // Separate custom interests not present in standard taxonomy
  const customInterests = useMemo(() => {
    return selectedInterests.filter(interest => {
      // Check if interest or interest without domain prefix matches predefined list
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

  // Get selected count for a specific domain's sub-domains
  const getDomainSelectedCount = (domainName: string, subDomains: string[]) => {
    const formattedSubs = subDomains.map(s => `${domainName}: ${s}`)
    return selectedInterests.filter(i =>
      formattedSubs.some(sub => sub.toLowerCase() === i.toLowerCase()) ||
      i.toLowerCase() === domainName.toLowerCase()
    ).length
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-12">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manage Your Interests</h1>
        <p className="text-default-500 mt-1">
          Explore domains and sub-interests to personalize peer recommendations, study groups, and community matching.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Domain & Sub-Domain Explorer */}
        <Card className="lg:col-span-2 shadow-md border border-divider">
          <CardBody className="p-6 gap-6">
            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Explore Interest Domains
              </h3>
              <Input
                placeholder="Search domain or sub-interest (e.g. Python, VLSI, CAD, Fitness)..."
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
                  <span className="text-xs text-primary-600">Add "{searchQuery.trim()}" as a custom interest.</span>
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
                        // Standard Domain without sub-interests
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

                      // Domain WITH Sub-Interests (Expandable)
                      const allSubsSelected = dom.subDomains!.every(sub =>
                        selectedInterests.some(i => i.toLowerCase() === `${dom.name}: ${sub}`.toLowerCase())
                      )

                      return (
                        <div
                          key={dom.name}
                          className="flex flex-col rounded-xl border border-default-200/80 bg-default-50/50 overflow-hidden transition-all duration-200 hover:border-default-300"
                        >
                          {/* Domain Header / Toggle Button */}
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

                            {/* Actions for Domain */}
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
                                {isExpanded ? 'Hide Sub-Interests' : 'View Sub-Interests'}
                              </Button>
                            </div>
                          </div>

                          {/* Sub-Interests Accordion Body */}
                          {isExpanded && (
                            <div className="p-4 border-t border-default-200/60 bg-background/50 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
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

        {/* Right Column: Selected Interests Summary */}
        <Card className="shadow-md border border-divider h-fit sticky top-6">
          <CardBody className="p-6 justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">Selected Interests</h3>
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
                    Clear All
                  </Button>
                )}
              </div>

              {/* Selected List Chips */}
              <div className="flex flex-wrap gap-2 max-h-[460px] overflow-y-auto pr-1">
                {selectedInterests.map(interest => {
                  // Find category matching this interest for badge color
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
                  <div className="p-6 text-center text-default-400 border border-dashed border-default-200 rounded-xl w-full">
                    <p className="text-sm font-medium">No interests selected yet.</p>
                    <p className="text-xs text-default-400 mt-1">
                      Expand any domain on the left to select sub-interests or add your own custom interests!
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button
              color="primary"
              size="lg"
              className="w-full font-semibold shadow-md"
              onClick={handleSave}
              isLoading={isLoading}
            >
              Save Interests
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
