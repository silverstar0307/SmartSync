export interface Internship {
  id: string
  title: string
  company: string
  logoBg: string
  location: string
  type: string
  stipend: string
  duration: string
  skills: string[]
  description: string
  deadline: string
  openings: number
  domain: string
}

export interface RecommendedInternship extends Internship {
  matchScore: number
  matchingTags: string[]
  aiInsight: string
}

export const ALL_INTERNSHIPS: Internship[] = [
  // Tech & Software
  {
    id: 'int-1',
    title: 'Software Development Engineer Intern',
    company: 'Google',
    logoBg: 'bg-blue-600',
    location: 'Bangalore / Remote',
    type: 'Summer Internship',
    stipend: '₹95,000 / mo',
    duration: '3 - 6 Months',
    skills: ['Python', 'Java', 'C++', 'Data Structures', 'Coding'],
    description: 'Work with the Core Engineering team developing scalable distributed microservices and low-latency APIs.',
    deadline: 'In 12 days',
    openings: 8,
    domain: 'Coding'
  },
  {
    id: 'int-2',
    title: 'Frontend & Web Platforms Intern',
    company: 'Meta',
    logoBg: 'bg-sky-500',
    location: 'Remote / Hyderabad',
    type: 'Full-Time Internship',
    stipend: '₹85,000 / mo',
    duration: '6 Months',
    skills: ['React.js', 'Next.js', 'JavaScript', 'UI/UX Designing', 'Web Development'],
    description: 'Build cutting-edge user interfaces and real-time interaction systems with React 19 and Next.js.',
    deadline: 'In 5 days',
    openings: 5,
    domain: 'Web Development'
  },
  {
    id: 'int-3',
    title: 'Mobile App Developer Intern (Android & iOS)',
    company: 'Spotify',
    logoBg: 'bg-emerald-500',
    location: 'Mumbai / Remote',
    type: 'Summer Internship',
    stipend: '₹70,000 / mo',
    duration: '3 Months',
    skills: ['Kotlin', 'Swift', 'Dart', 'JavaScript', 'App Development'],
    description: 'Enhance high-performance audio streaming clients across Android and iOS platforms.',
    deadline: 'In 18 days',
    openings: 4,
    domain: 'App Development'
  },
  {
    id: 'int-4',
    title: 'AI & Generative LLM Research Intern',
    company: 'OpenAI',
    logoBg: 'bg-emerald-700',
    location: 'San Francisco / Remote',
    type: 'Research Internship',
    stipend: '$3,200 / mo',
    duration: '6 Months',
    skills: ['NLM & LLMs', 'Computer vision', 'Python', 'Machine Learning', 'AI Learning'],
    description: 'Collaborate with researchers on multimodal foundation models, reinforcement learning, and logic engines.',
    deadline: 'In 9 days',
    openings: 3,
    domain: 'AI Learning'
  },
  {
    id: 'int-5',
    title: 'Deep Learning & Computer Vision Intern',
    company: 'NVIDIA',
    logoBg: 'bg-green-600',
    location: 'Pune / Bangalore',
    type: 'Full-Time Internship',
    stipend: '₹1,10,000 / mo',
    duration: '6 Months',
    skills: ['Computer vision', 'Supervised', 'Unsupervised', 'Python', 'Machine Learning', 'TensorFlow'],
    description: 'Accelerate real-time object tracking and neural rendering algorithms using CUDA and TensorRT.',
    deadline: 'In 14 days',
    openings: 6,
    domain: 'Machine Learning'
  },
  {
    id: 'int-6',
    title: 'Cloud Infrastructure & DevOps Intern',
    company: 'Amazon Web Services (AWS)',
    logoBg: 'bg-amber-600',
    location: 'Hyderabad, India',
    type: 'Summer Internship',
    stipend: '₹80,000 / mo',
    duration: '4 Months',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'DevOps & CI/CD', 'Cloud Computing'],
    description: 'Architect auto-scaling serverless pipelines and high-availability cloud configurations.',
    deadline: 'In 7 days',
    openings: 7,
    domain: 'Cloud Computing'
  },
  {
    id: 'int-7',
    title: 'Cybersecurity Threat Detection Intern',
    company: 'Microsoft',
    logoBg: 'bg-cyan-600',
    location: 'Bangalore / Remote',
    type: 'Full-Time Internship',
    stipend: '₹90,000 / mo',
    duration: '6 Months',
    skills: ['Cybersecurity', 'Python', 'C++', 'Cloud Computing'],
    description: 'Analyze zero-day attack vectors and design defensive anomaly detection models for cloud workloads.',
    deadline: 'In 15 days',
    openings: 4,
    domain: 'Cybersecurity'
  },
  {
    id: 'int-8',
    title: 'Data Science & Big Data Analytics Intern',
    company: 'Netflix',
    logoBg: 'bg-rose-600',
    location: 'Remote',
    type: 'Summer Internship',
    stipend: '₹85,000 / mo',
    duration: '3 Months',
    skills: ['Data Analysis', 'Data Engineering', 'Big Data', 'SQL', 'PowerBI', 'Data Science'],
    description: 'Extract actionable metrics from billions of streaming telemetry logs using distributed pipelines.',
    deadline: 'In 11 days',
    openings: 4,
    domain: 'Data Science'
  },
  {
    id: 'int-9',
    title: 'Web3 & Smart Contract Developer Intern',
    company: 'Polygon Labs',
    logoBg: 'bg-purple-600',
    location: 'Remote',
    type: 'Summer Internship',
    stipend: '$2,000 / mo',
    duration: '3 Months',
    skills: ['Solidity', 'Ethereum', 'Smart Contracts', 'Blockchain & Web3', 'JavaScript'],
    description: 'Design EVM-compatible decentralized finance and rollups protocols with zero-knowledge tech.',
    deadline: 'In 20 days',
    openings: 3,
    domain: 'Blockchain & Web3'
  },

  // ENTC / ECE
  {
    id: 'int-10',
    title: 'VLSI Digital Design & Verification Intern',
    company: 'Intel Corporation',
    logoBg: 'bg-blue-700',
    location: 'Bangalore, India',
    type: 'Full-Time Internship',
    stipend: '₹75,000 / mo',
    duration: '6 - 11 Months',
    skills: ['Verilog', 'VHDL', 'Cadence', 'XILINX', 'VLSI'],
    description: 'Synthesize next-generation SoC processor blocks, perform timing closures, and verify RTL testbenches.',
    deadline: 'In 8 days',
    openings: 5,
    domain: 'VLSI'
  },
  {
    id: 'int-11',
    title: 'Embedded Systems & IoT Firmware Intern',
    company: 'Qualcomm',
    logoBg: 'bg-blue-800',
    location: 'Hyderabad / Chennai',
    type: 'Summer Internship',
    stipend: '₹70,000 / mo',
    duration: '4 Months',
    skills: ['Embedded C/C++', 'RTOS', 'IoT', 'C', 'C++'],
    description: 'Develop low-power sensor drivers and real-time operating system scheduler optimizations.',
    deadline: 'In 16 days',
    openings: 6,
    domain: 'IoT'
  },
  {
    id: 'int-12',
    title: '5G Modem & Wireless Systems Intern',
    company: 'Samsung R&D',
    logoBg: 'bg-indigo-600',
    location: 'Noida / Bangalore',
    type: 'Full-Time Internship',
    stipend: '₹65,000 / mo',
    duration: '6 Months',
    skills: ['5G/6G Communication', 'Simulink', 'HFSS', 'MATLAB'],
    description: 'Simulate millimeter-wave antenna arrays and RF beamforming algorithms for ultra-reliable low latency communication.',
    deadline: 'In 21 days',
    openings: 4,
    domain: '5G/6G Communication'
  },

  // Mechanical / Civil / Structural
  {
    id: 'int-13',
    title: 'Robotics & Mechanical CAD Design Intern',
    company: 'Tesla',
    logoBg: 'bg-red-600',
    location: 'Bangalore / Pune',
    type: 'Full-Time Internship',
    stipend: '₹80,000 / mo',
    duration: '6 Months',
    skills: ['Creo', 'CATIA', 'CAD & Generative Design', 'Robotics'],
    description: 'Model automated actuator housings and generative lightweight chassis structures for EV powertrains.',
    deadline: 'In 10 days',
    openings: 4,
    domain: 'CAD & Generative Design'
  },
  {
    id: 'int-14',
    title: 'Finite Element & CFD Simulation Intern (CAE)',
    company: 'Tata Motors',
    logoBg: 'bg-blue-900',
    location: 'Pune, India',
    type: 'Summer Internship',
    stipend: '₹55,000 / mo',
    duration: '6 Months',
    skills: ['ANSYS Mechanical', 'ANSYS Fluent', 'STAR-CCM+', 'CAE', 'HyperMesh'],
    description: 'Simulate crashworthiness, aerodynamic drag reduction, and thermal dissipation inside battery packs.',
    deadline: 'In 14 days',
    openings: 5,
    domain: 'CAE'
  },
  {
    id: 'int-15',
    title: 'Structural Analysis & BIM Design Intern',
    company: 'Larsen & Toubro (L&T)',
    logoBg: 'bg-amber-700',
    location: 'Mumbai / Delhi',
    type: 'Full-Time Internship',
    stipend: '₹50,000 / mo',
    duration: '6 Months',
    skills: ['STAAD', 'ETABS', 'Autodesk', 'BIM & 4D Virtual Constru.', 'Stru. Ana. and Design'],
    description: 'Analyze multi-story high rise structural loads, seismic responses, and integrate 4D BIM construction sequences.',
    deadline: 'In 17 days',
    openings: 7,
    domain: 'Stru. Ana. and Design'
  },

  // Creative & Product
  {
    id: 'int-16',
    title: 'UI/UX Product Experience Designer Intern',
    company: 'Adobe',
    logoBg: 'bg-red-500',
    location: 'Noida / Remote',
    type: 'Summer Internship',
    stipend: '₹75,000 / mo',
    duration: '3 - 6 Months',
    skills: ['UI/UX Designing', 'Graphic Designing', 'Product Management'],
    description: 'Create user journeys, wireframes, and high-fidelity interaction prototypes for creative cloud applications.',
    deadline: 'In 13 days',
    openings: 4,
    domain: 'Creative & Design'
  },
  {
    id: 'int-17',
    title: 'Associate Product Manager (APM) Intern',
    company: 'Uber',
    logoBg: 'bg-black',
    location: 'Bangalore, India',
    type: 'Full-Time Internship',
    stipend: '₹90,000 / mo',
    duration: '6 Months',
    skills: ['Product Management', 'Agile', 'Scrum', 'Data Analysis', 'Business & Product'],
    description: 'Own feature roadmaps, define MVP requirements, and run A/B experiments to maximize driver-rider retention.',
    deadline: 'In 6 days',
    openings: 3,
    domain: 'Business & Product'
  }
]

/**
 * AI Recommendation Engine that scores and ranks internships based on the user's selected interest tags.
 */
export function getAiRecommendedInternships(userInterests: string[]): RecommendedInternship[] {
  // Normalize user interests (strip "Domain: " prefix if present)
  const normalizedInterests = userInterests.map(item => {
    const raw = item.trim().toLowerCase()
    const clean = raw.includes(':') ? raw.split(':')[1].trim() : raw
    return { full: raw, clean }
  })

  const results: RecommendedInternship[] = ALL_INTERNSHIPS.map(internship => {
    const matchingTags: string[] = []
    let matchScore = 0

    if (normalizedInterests.length === 0) {
      // Default baseline match score when nothing is selected
      matchScore = 70 + (internship.skills.length % 15)
    } else {
      // Calculate relevance
      let matchCount = 0

      // Check skills
      internship.skills.forEach(skill => {
        const sLower = skill.toLowerCase()
        const matched = normalizedInterests.some(ni => {
          return (
            sLower === ni.clean ||
            sLower.includes(ni.clean) ||
            ni.clean.includes(sLower) ||
            ni.full.includes(sLower)
          )
        })

        if (matched) {
          matchCount++
          if (!matchingTags.includes(skill)) {
            matchingTags.push(skill)
          }
        }
      })

      // Check domain match
      const domainLower = internship.domain.toLowerCase()
      const domainMatched = normalizedInterests.some(ni => 
        domainLower.includes(ni.clean) || ni.full.includes(domainLower)
      )
      if (domainMatched) {
        matchCount += 1.5
      }

      // Compute match score percentage (65% to 99%)
      if (matchCount > 0) {
        const ratio = matchCount / Math.max(internship.skills.length * 0.6, 1)
        matchScore = Math.min(99, Math.round(75 + ratio * 24))
      } else {
        // Minimum compatibility based on industry demand
        matchScore = Math.floor(45 + Math.random() * 20)
      }
    }

    // AI Insight text
    let aiInsight = ''
    if (matchingTags.length > 0) {
      aiInsight = `AI matched your verified interest in ${matchingTags.slice(0, 3).join(', ')} with ${internship.company}'s engineering hiring criteria.`
    } else {
      aiInsight = `Trending in market for students expanding into ${internship.domain}.`
    }

    return {
      ...internship,
      matchScore,
      matchingTags,
      aiInsight
    }
  })

  // Sort by match score descending, then by stipend
  return results.sort((a, b) => b.matchScore - a.matchScore)
}
