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
      { name: 'Cybersecurity' },
      { name: 'Game Development' }
    ]
  },
  {
    category: 'Trending Skills',
    color: 'default',
    bgClass: 'bg-default-500',
    domains: [
      {
        name: 'Cloud Computing',
        subDomains: ['AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes']
      },
      {
        name: 'Data Science',
        subDomains: ['Data Analysis', 'Data Engineering', 'Big Data', 'PowerBI']
      },
      {
        name: 'Blockchain & Web3',
        subDomains: ['Smart Contracts', 'Solidity', 'Ethereum']
      },
      {
        name: 'DevOps & CI/CD',
        subDomains: ['Jenkins', 'GitOps', 'Terraform']
      },
      {
        name: 'Business & Product',
        subDomains: ['Product Management', 'Agile', 'Scrum', 'Digital Marketing']
      }
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
    category: 'Creative & Design',
    color: 'success',
    bgClass: 'bg-success',
    domains: [
      { name: 'UI/UX Designing' },
      { name: 'Graphic Designing' },
      { name: '3D Animation & Modeling' },
      { name: 'Video Editing & Production' }
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
