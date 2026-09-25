import { Resume } from './schema';
// Entirely fictional demonstration data. Never presented as the owner's credentials.
export const sampleResume: Resume = {
  id: '00000000-0000-4000-8000-000000000001',
  slug: 'master',
  title: 'Master resume',
  profile: {
    name: 'Alex Morgan',
    headline: 'Data science student · Building thoughtful AI systems',
    summary:
      'Turning complex data into useful products. Interested in retrieval systems, applied machine learning, and the engineering that makes AI reliable beyond a notebook.',
    email: 'alex@example.com',
    phone: '',
    location: 'Charlotte, NC',
    website: '',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
  experience: [
    {
      id: '00000000-0000-4000-8000-000000000002',
      organization: 'University Applied AI Lab',
      position: 'Undergraduate Research Assistant',
      location: 'Charlotte, NC',
      startDate: '2025-08',
      endDate: '',
      current: true,
      bullets: [
        'Built reproducible Python pipelines to clean, embed, and evaluate a collection of research papers.',
        'Developed a retrieval evaluation harness comparing semantic and hybrid search; documented failure cases for faculty review.',
      ],
      technologies: ['Python', 'PyTorch', 'Azure AI Search'],
      url: '',
      details:
        'Fictional sample experience. Work centered on repeatable experiments, source attribution, and communicating model limitations.',
    },
    {
      id: '00000000-0000-4000-8000-000000000003',
      organization: 'Campus Digital Services',
      position: 'Student Software Developer',
      location: 'Charlotte, NC',
      startDate: '2025-01',
      endDate: '2025-07',
      current: false,
      bullets: [
        'Developed accessible React interfaces and typed API endpoints for a student resource directory.',
        'Designed PostgreSQL queries and added automated checks for the application’s core workflows.',
      ],
      technologies: ['TypeScript', 'React', 'PostgreSQL'],
      url: '',
      details: '',
    },
  ],
  projects: [
    {
      id: '00000000-0000-4000-8000-000000000004',
      title: 'Atlas / Research companion',
      description: 'A source-grounded assistant for exploring academic papers.',
      longDescription:
        'A retrieval-augmented research tool that keeps every answer connected to its source. Built to explore how retrieval quality and explicit uncertainty affect the usefulness of generative AI.',
      bullets: ['Implemented document ingestion, hybrid retrieval, and citation-backed responses.'],
      technologies: ['Python', 'Generative AI', 'Azure AI', 'FastAPI'],
      github: '',
      liveUrl: '',
      images: [],
      architecture:
        'PDF ingestion → chunking → embeddings → hybrid search → grounded generation. Evaluation runs separately against a curated set of questions.',
    },
    {
      id: '00000000-0000-4000-8000-000000000005',
      title: 'Signal / ML experiment workspace',
      description: 'From raw datasets to comparable, reproducible experiments.',
      longDescription:
        'A small workspace for training baseline models and comparing their performance. Experiment metadata and dataset versions make results easier to revisit.',
      bullets: [
        'Built a model comparison workflow with cross-validation and an interactive results view.',
      ],
      technologies: ['scikit-learn', 'Next.js', 'PostgreSQL'],
      github: '',
      liveUrl: '',
      images: [],
      architecture:
        'Python training jobs write versioned metrics to PostgreSQL. A TypeScript application renders experiment comparisons.',
    },
  ],
  education: [
    {
      id: '00000000-0000-4000-8000-000000000006',
      institution: 'Example State University',
      degree: 'B.S.',
      major: 'Data Science',
      minor: 'Computer Science',
      startDate: '2023',
      endDate: '2027',
      location: 'Charlotte, NC',
      coursework: [
        'Machine Learning',
        'Linear Algebra',
        'Database Systems',
        'Statistical Modeling',
      ],
      achievements: [],
    },
  ],
  skills: [
    {
      id: '00000000-0000-4000-8000-000000000007',
      category: 'Languages',
      items: ['Python', 'TypeScript', 'SQL', 'JavaScript'],
    },
    {
      id: '00000000-0000-4000-8000-000000000008',
      category: 'AI & data',
      items: ['PyTorch', 'scikit-learn', 'Pandas', 'RAG', 'AI agents'],
    },
    {
      id: '00000000-0000-4000-8000-000000000009',
      category: 'Engineering',
      items: ['React', 'Next.js', 'FastAPI', 'PostgreSQL', 'Azure', 'Git'],
    },
  ],
  certifications: [
    {
      id: '00000000-0000-4000-8000-000000000010',
      name: 'Azure AI Fundamentals',
      issuer: 'Microsoft · illustrative credential',
      issueDate: '2025-06',
      credentialId: '',
      credentialUrl: '',
      description:
        'Fictional sample only. Replace with your own verified certification before publishing.',
    },
  ],
  sectionOrder: ['experience', 'projects', 'education', 'skills', 'certifications'],
  metadata: {
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    version: 0,
    sample: true,
  },
};
