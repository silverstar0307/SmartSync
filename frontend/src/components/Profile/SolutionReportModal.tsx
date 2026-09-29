'use client'

import React from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, Button } from '@nextui-org/react'
import { Printer, Download, X, Award } from 'lucide-react'

export interface SolutionItem {
  id: number
  solution_title?: string
  solution_content: string
  solution_media?: string[]
  solution_challenge_data?: { type?: string }
  solution_created_at: string
  like_count?: number
  challenge_id: number
  challenge_title?: string
  challenge_content: string
  challenge_meta?: any
  challenge_created_at?: string
  community_id?: number
  community_name?: string
  community_slug?: string
}

interface UserProfileInfo {
  first_name?: string
  last_name?: string
  username?: string
  college_name?: string
  division?: string
}

interface SolutionReportModalProps {
  isOpen: boolean
  onClose: () => void
  solutions: SolutionItem[]
  userProfile?: UserProfileInfo
  backendUrl: string
}

const getDifficultyClass = (diff?: string) => {
  const d = (diff || 'EASY').toUpperCase()
  if (d === 'HARD') return 'difficulty-hard'
  if (d === 'MODERATE' || d === 'MEDIUM') return 'difficulty-medium'
  return 'difficulty-easy'
}

const getDifficultyLabel = (diff?: string) => {
  const d = (diff || 'EASY').toUpperCase()
  if (d === 'HARD') return 'Hard'
  if (d === 'MODERATE' || d === 'MEDIUM') return 'Medium'
  return 'Easy'
}

const getChallengeIcon = (index: number) => {
  const icons = ['⚡', '💻', '🔒', '🎯', '🧠', '🚀', '🔥', '🏆']
  return icons[index % icons.length]
}

export const buildStandaloneReportHtml = (
  solutions: SolutionItem[],
  userProfile?: UserProfileInfo,
  backendUrl: string = ''
) => {
  const candidateName = userProfile?.first_name 
    ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim()
    : (userProfile?.username || 'User')
  const username = userProfile?.username || 'user'
  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  const challengesHtml = solutions.map((item, index) => {
    const icon = getChallengeIcon(index)
    const title = item.challenge_title || item.challenge_content?.slice(0, 60) || `Challenge #${index + 1}`
    const difficultyLabel = getDifficultyLabel(item.challenge_meta?.difficulty)
    const difficultyClass = getDifficultyClass(item.challenge_meta?.difficulty)
    const description = item.challenge_content || 'No description provided for this challenge.'
    const community = item.community_name || 'Smart Sync Community'
    const solvedDate = new Date(item.solution_created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    const solutionType = item.solution_challenge_data?.type || 'TEXT'

    let solutionMediaHtml = ''
    if (item.solution_media && item.solution_media.length > 0) {
      const mediaUrl = `${backendUrl}${item.solution_media[0]}`
      if (solutionType === 'IMAGE') {
        solutionMediaHtml = `<div style="margin-top: 10px;"><img src="${mediaUrl}" alt="Solution" style="max-width: 100%; max-height: 320px; border-radius: 8px; border: 1px solid #cbd5e1;" /></div>`
      } else {
        solutionMediaHtml = `<div style="margin-top: 10px;"><a href="${mediaUrl}" target="_blank" style="color: #2563eb; font-weight: 500; text-decoration: underline;">View Attached Solution File (${solutionType})</a></div>`
      }
    }

    return `
      <div class="challenge-block">
        <div class="challenge-header">
          <span class="challenge-icon">${icon}</span>
          <h3 class="challenge-title">${title}</h3>
          <span class="difficulty-badge ${difficultyClass}">${difficultyLabel}</span>
        </div>
        
        <div class="challenge-description">${description}</div>
        
        <div class="challenge-meta-line">
          <div class="meta-stat">
            <span>🏷️</span>
            <span>Community:</span>
            <span class="meta-stat-value">${community}</span>
          </div>
          <div class="meta-stat">
            <span>📅</span>
            <span>Solved:</span>
            <span class="meta-stat-value">${solvedDate}</span>
          </div>
          <div class="meta-stat">
            <span>📌</span>
            <span>Format:</span>
            <span class="meta-stat-value">${solutionType}</span>
          </div>
        </div>
        
        <div class="solution-block">
          <div class="solution-label">Your Solution</div>
          ${item.solution_content ? `
            <div class="code-block">
              <pre style="margin: 0; font-family: inherit; white-space: pre-wrap; word-break: break-word;">${item.solution_content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            </div>
          ` : ''}
          ${solutionMediaHtml}
        </div>
      </div>
    `
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${candidateName} - Challenge Completion Report</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
    }
    
    .report-container {
      background: #ffffff;
      max-width: 900px;
      margin: 0 auto;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
    }
    
    .report-header {
      background: linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%);
      color: white;
      padding: 2.5rem 2rem;
      text-align: center;
    }
    
    .report-header h1 {
      margin: 0 0 0.5rem;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    
    .report-header p {
      margin: 0;
      opacity: 0.95;
      font-size: 15px;
    }

    .report-header .candidate-badge {
      display: inline-block;
      margin-top: 0.75rem;
      padding: 4px 14px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      backdrop-filter: blur(4px);
    }
    
    .report-meta {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1.5rem;
      padding: 1.5rem 2rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .meta-item {
      text-align: center;
    }
    
    .meta-label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.35rem;
      font-weight: 600;
    }
    
    .meta-value {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }
    
    .challenges-section {
      padding: 2rem;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #3B82F6;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .challenge-block {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      page-break-inside: avoid;
    }
    
    .challenge-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 1rem;
    }
    
    .challenge-icon {
      font-size: 22px;
    }
    
    .challenge-title {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
      flex: 1;
    }
    
    .difficulty-badge {
      margin-left: auto;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-align: center;
      text-transform: capitalize;
    }
    
    .difficulty-easy {
      background: #D1FAE5;
      color: #047857;
    }
    
    .difficulty-medium {
      background: #FEF3C7;
      color: #B45309;
    }
    
    .difficulty-hard {
      background: #FECACA;
      color: #991B1B;
    }
    
    .challenge-description {
      font-size: 13px;
      color: #334155;
      line-height: 1.6;
      margin-bottom: 1rem;
      padding: 1rem;
      background: #ffffff;
      border-radius: 8px;
      border-left: 3px solid #06B6D4;
      white-space: pre-wrap;
    }
    
    .challenge-meta-line {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1rem;
      font-size: 12px;
      flex-wrap: wrap;
    }
    
    .meta-stat {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #64748b;
    }
    
    .meta-stat-value {
      font-weight: 600;
      color: #0f172a;
    }
    
    .solution-block {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      margin-top: 1rem;
    }
    
    .solution-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
      margin-bottom: 0.75rem;
    }
    
    .code-block {
      background: #0F172A;
      border-radius: 6px;
      padding: 1rem;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      line-height: 1.6;
      color: #E2E8F0;
    }
    
    .footer {
      padding: 2rem;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
    
    .button-group {
      display: flex;
      gap: 12px;
      margin-top: 1.5rem;
      justify-content: center;
    }
    
    button.action-btn {
      padding: 10px 20px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #0f172a;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 150ms ease-out;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    
    button.action-btn:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
    }
    
    button.action-btn.primary {
      background: #3B82F6;
      color: white;
      border-color: #3B82F6;
    }
    
    button.action-btn.primary:hover {
      background: #1D4ED8;
      border-color: #1D4ED8;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }
      .report-container {
        box-shadow: none;
        border: none;
        max-width: 100%;
      }
      .button-group {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="report-header">
      <h1>Challenge Completion Report</h1>
      <p>Verified solutions and achievements for your portfolio</p>
      <div class="candidate-badge">Prepared for ${candidateName} (@${username})</div>
    </div>
    
    <div class="report-meta">
      <div class="meta-item">
        <div class="meta-label">Candidate</div>
        <div class="meta-value">${candidateName}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Challenges Completed</div>
        <div class="meta-value">${solutions.length}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Report Generated</div>
        <div class="meta-value" style="font-size: 14px; font-weight: 600;">${generatedDate}</div>
      </div>
    </div>
    
    <div class="challenges-section">
      <h2 class="section-title">
        <span>Your Solutions</span>
        <span style="font-size: 13px; color: #64748b; font-weight: 500;">${solutions.length} ${solutions.length === 1 ? 'record' : 'records'}</span>
      </h2>
      ${challengesHtml}
    </div>
    
    <div class="footer">
      <p style="margin: 0 0 1rem;">Generated from Smart Sync - Challenge Completion System</p>
      <div class="button-group">
        <button class="action-btn" onclick="window.print()">
          🖨️ Print / Save as PDF
        </button>
      </div>
    </div>
  </div>
</body>
</html>`
}

export default function SolutionReportModal({
  isOpen,
  onClose,
  solutions,
  userProfile,
  backendUrl
}: SolutionReportModalProps) {
  const candidateName = userProfile?.first_name 
    ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim()
    : (userProfile?.username || 'User')
  const username = userProfile?.username || 'user'
  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  const handlePrint = () => {
    const html = buildStandaloneReportHtml(solutions, userProfile, backendUrl)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 350)
    }
  }

  const handleDownloadHtml = () => {
    const html = buildStandaloneReportHtml(solutions, userProfile, backendUrl)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${username}_challenge_report.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="4xl" 
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[92vh] bg-background",
        header: "border-b border-divider py-4 px-6 flex items-center justify-between",
        body: "p-0 overflow-y-auto",
        footer: "border-t border-divider py-3 px-6"
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Award size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">Challenge Completion Report</h3>
                  <p className="text-xs text-default-400 font-normal">Resume-ready portfolio summary</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="flat" 
                  color="default"
                  startContent={<Printer size={15} />}
                  onClick={handlePrint}
                >
                  Print / Save PDF
                </Button>
                <Button 
                  size="sm" 
                  color="primary"
                  startContent={<Download size={15} />}
                  onClick={handleDownloadHtml}
                >
                  Download Report
                </Button>
              </div>
            </ModalHeader>

            <ModalBody>
              <div className="bg-default-50/50 p-4 sm:p-6 flex justify-center">
                <div className="w-full max-w-[850px] bg-background border border-divider rounded-2xl shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-8 text-center">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Challenge Completion Report</h1>
                    <p className="text-sm text-white/90 mt-1">Verified solutions and achievements for your portfolio</p>
                    <div className="inline-block mt-3 px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-xs">
                      Prepared for {candidateName} (@{username})
                    </div>
                  </div>

                  {/* Meta Bar */}
                  <div className="grid grid-cols-3 gap-4 p-5 bg-default-100/60 border-b border-divider text-center">
                    <div>
                      <div className="text-[11px] font-bold text-default-500 uppercase tracking-wider">Candidate</div>
                      <div className="text-sm sm:text-base font-bold text-foreground mt-0.5 truncate">{candidateName}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-default-500 uppercase tracking-wider">Challenges Completed</div>
                      <div className="text-sm sm:text-base font-bold text-foreground mt-0.5">{solutions.length}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-default-500 uppercase tracking-wider">Report Generated</div>
                      <div className="text-xs sm:text-sm font-semibold text-foreground mt-1">{generatedDate}</div>
                    </div>
                  </div>

                  {/* Solutions list */}
                  <div className="p-6 flex flex-col gap-6">
                    <div className="flex items-center justify-between pb-3 border-b-2 border-primary">
                      <h2 className="text-lg font-bold text-foreground">Your Solutions</h2>
                      <span className="text-xs font-medium text-default-500">{solutions.length} solved</span>
                    </div>

                    {solutions.length === 0 ? (
                      <div className="py-12 text-center text-default-400 text-sm">
                        No solved challenges found to include in this report.
                      </div>
                    ) : (
                      solutions.map((item, index) => {
                        const icon = getChallengeIcon(index)
                        const title = item.challenge_title || item.challenge_content?.slice(0, 60) || `Challenge #${index + 1}`
                        const difficulty = getDifficultyLabel(item.challenge_meta?.difficulty)
                        const difficultyColor = difficulty === 'Hard' ? 'bg-red-100 text-red-700' : difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        const solutionType = item.solution_challenge_data?.type || 'TEXT'

                        return (
                          <div key={item.id} className="p-5 rounded-xl border border-divider bg-default-50/50 flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-2.5">
                                <span className="text-xl">{icon}</span>
                                <h3 className="font-bold text-sm sm:text-base text-foreground">{title}</h3>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${difficultyColor}`}>
                                {difficulty}
                              </span>
                            </div>

                            <div className="p-3.5 bg-background rounded-lg border-l-4 border-cyan-500 text-xs sm:text-sm text-default-700 whitespace-pre-wrap leading-relaxed shadow-2xs">
                              {item.challenge_content || 'No description provided for this challenge.'}
                            </div>

                            <div className="flex items-center gap-4 text-xs text-default-500 flex-wrap pt-1">
                              <div>
                                🏷️ Community: <strong className="text-foreground font-semibold">{item.community_name || 'Smart Sync Community'}</strong>
                              </div>
                              <div>
                                📅 Solved: <strong className="text-foreground font-semibold">{new Date(item.solution_created_at).toLocaleDateString()}</strong>
                              </div>
                              <div>
                                📌 Format: <strong className="text-foreground font-semibold">{solutionType}</strong>
                              </div>
                            </div>

                            <div className="p-3.5 bg-background rounded-lg border border-divider/60 flex flex-col gap-2 mt-1">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-default-500">Your Solution</span>
                              {item.solution_content && (
                                <div className="p-3 bg-slate-950 text-slate-100 rounded-md font-mono text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap">
                                  {item.solution_content}
                                </div>
                              )}
                              {item.solution_media && item.solution_media.length > 0 && (
                                <div className="mt-2">
                                  {solutionType === 'IMAGE' ? (
                                    <img 
                                      src={`${backendUrl}${item.solution_media[0]}`} 
                                      alt="Solution Upload" 
                                      className="max-h-64 rounded-lg border border-divider object-contain"
                                    />
                                  ) : (
                                    <a 
                                      href={`${backendUrl}${item.solution_media[0]}`} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="text-xs text-primary font-semibold hover:underline"
                                    >
                                      View Uploaded Solution File ({solutionType})
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-6 bg-background border-t border-divider text-center text-xs text-default-500 flex flex-col items-center gap-3">
                    <p>Generated from Smart Sync - Challenge Completion System</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="flat" color="default" startContent={<Printer size={14} />} onClick={handlePrint}>
                        Print / Save PDF
                      </Button>
                      <Button size="sm" color="primary" startContent={<Download size={14} />} onClick={handleDownloadHtml}>
                        Download Report
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
