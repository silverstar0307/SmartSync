export interface SubDomain {
  id: string
  name: string
}

export interface InterestDomain {
  name: string
  subDomains?: string[]
}

export interface InterestCategory {
  category: string
  color: 'secondary' | 'warning' | 'danger' | 'success' | 'primary' | 'default'
  bgClass: string
  domains: InterestDomain[]
}

export const INTEREST_TAXONOMY: InterestCategory[] = [
  {
    category: 'College Studies',
    color: 'default',
    bgClass: 'bg-default-500',
    domains: [
      {
        name: 'First Year',
        subDomains: ['Group A', 'Group B']
      },
      {
        name: 'Second Year',
        subDomains: ['CS', 'IT', 'ECE', 'ENTC', 'MECHANICAL', 'CIVIL', 'AIML']
      },
      {
        name: 'Third Year',
        subDomains: ['CS', 'IT', 'ECE', 'ENTC', 'MECHANICAL', 'CIVIL', 'AIML']
      },
      {
        name: 'Final Year',
        subDomains: ['CS', 'IT', 'ECE', 'ENTC', 'MECHANICAL', 'CIVIL', 'AIML']
      }
    ]
  },
  {
    category: 'Tech Activities',
    color: 'secondary',
    bgClass: 'bg-secondary',
    domains: [
      {
        name: 'Coding',
        subDomains: ['C', 'C++', 'Java', 'JavaScript', 'Python']
      },
      {
        name: 'Web Development',
        subDomains: ['React.js', 'Next.js', 'SQL']
      },
      {
        name: 'App Development',
        subDomains: ['Kotlin', 'JavaScript', 'Swift', 'Dart']
      },
      {
        name: 'Machine Learning',
        subDomains: ['Supervised', 'Unsupervised', 'Reinforcement']
      },
      {
        name: 'AI Learning',
        subDomains: ['Computer vision', 'NLM & LLMs', 'Robotics', 'Logic engines']
      },
      { name: 'UI/UX Designing' },
      { name: 'Cybersecurity' },
      { name: 'Graphic Designing' },
      { name: 'Game Development' }
    ]
  },
  {
    category: 'Mechanical / Civil',
    color: 'warning',
    bgClass: 'bg-warning',
    domains: [
      {
        name: 'CAD & Generative Design',
        subDomains: ['Creo', 'CATIA']
      },
      {
        name: 'CAE',
        subDomains: ['ANSYS Mechanical', 'ANSYS Fluent', 'STAR-CCM+', 'HyperMesh']
      },
      {
        name: 'Stru. Ana. and Design',
        subDomains: ['STAAD', 'ETABS']
      },
      {
        name: 'BIM & 4D Virtual Constru.',
        subDomains: ['Autodesk', 'Navisworks']
      },
      {
        name: 'Geotech',
        subDomains: ['AutoCAD', 'PLAXIS']
      }
    ]
  },
  {
    category: 'ENTC / ECE',
    color: 'primary',
    bgClass: 'bg-primary',
    domains: [
      {
        name: 'VLSI',
        subDomains: ['Verilog', 'VHDL', 'Cadence', 'XILINX']
      },
      {
        name: 'IoT',
        subDomains: ['Embedded C/C++', 'RTOS']
      },
      {
        name: 'Edge AI & TinyML',
        subDomains: ['TensorFlow', 'MATLAB']
      },
      {
        name: '5G/6G Communication',
        subDomains: ['Simulink', 'HFSS']
      }
    ]
  },
  {
    category: 'Social Activities & Content',
    color: 'success',
    bgClass: 'bg-success',
    domains: [
      {
        name: 'Content Creation',
        subDomains: ['Writing', 'Video Editing', 'Video Shooting', 'Thumbnail Designing']
      },
      { name: 'Public Speaking' },
      { name: 'Anchoring' },
      { name: 'Presentations' },
      { name: 'Communication' },
      { name: 'NSS' },
      { name: 'Photography' }
    ]
  },
  {
    category: 'Extra Curricular',
    color: 'danger',
    bgClass: 'bg-danger',
    domains: [
      {
        name: 'Music',
        subDomains: ['Guitar', 'Tabala', 'Voilene', 'Drums', 'Flutes']
      },
      { name: 'Singing' },
      { name: 'Dancing' },
      { name: 'Acting' },
      { name: 'Standup Comedy' },
      { name: 'Gaming' }
    ]
  },
  {
    category: 'Sports (Indoor & Outdoor)',
    color: 'default',
    bgClass: 'bg-default-500',
    domains: [
      {
        name: 'Fitness',
        subDomains: ['Calisthenics', 'Powerlifting', 'Diet']
      },
      { name: 'Cricket' },
      { name: 'Volleyball' },
      { name: 'Football' },
      { name: 'Basketball' },
      { name: 'Kabaddi' },
      { name: 'Running' },
      { name: 'Table Tennis' },
      { name: 'Chess' },
      { name: 'Carrom' }
    ]
  }
]

export const getAllPredefinedInterests = (): string[] => {
  const list: string[] = []
  INTEREST_TAXONOMY.forEach(cat => {
    cat.domains.forEach(dom => {
      list.push(dom.name)
      if (dom.subDomains) {
        dom.subDomains.forEach(sub => {
          list.push(`${dom.name}: ${sub}`)
          list.push(sub)
        })
      }
    })
  })
  return Array.from(new Set(list))
}

export const getCommunityTags = (): string[] => {
  const list: string[] = []
  INTEREST_TAXONOMY.forEach(cat => {
    cat.domains.forEach(dom => {
      if (dom.subDomains && dom.subDomains.length > 0) {
        dom.subDomains.forEach(sub => {
          list.push(`${dom.name}: ${sub}`)
        })
      } else {
        list.push(dom.name)
      }
    })
  })
  return Array.from(new Set(list))
}
