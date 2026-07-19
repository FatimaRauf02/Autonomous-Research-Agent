// API base URL
export const API_BASE = '/api'

// Agent pipeline step labels with progress ranges
export const PIPELINE_STEPS = [
  { label: 'Decompose topic into queries',         range: [0,  15],  badge: 'GenAI' },
  { label: 'Search arXiv & Semantic Scholar',      range: [15, 30],  badge: 'MCP' },
  { label: 'Download & parse PDFs',                range: [30, 50],  badge: 'RAG' },
  { label: 'Extract claims with NLP (SciBERT)',     range: [50, 65],  badge: 'NLP' },
  { label: 'Detect contradictions (NLI model)',    range: [65, 75],  badge: 'NLP' },
  { label: 'Cluster topics & identify gaps',       range: [75, 85],  badge: 'ML' },
  { label: 'Generate structured report',           range: [85, 100], badge: 'GenAI' },
]

// Badge colours per AI discipline
export const BADGE_COLORS = {
  GenAI: 'bg-amber-900/50 text-amber-300 border-amber-800',
  NLP:   'bg-rose-900/50  text-rose-300  border-rose-800',
  ML:    'bg-purple-900/50 text-purple-300 border-purple-800',
  DL:    'bg-green-900/50 text-green-300 border-green-800',
  RAG:   'bg-blue-900/50  text-blue-300  border-blue-800',
  MCP:   'bg-teal-900/50  text-teal-300  border-teal-800',
}

// Example research topics shown on the search page
export const EXAMPLE_TOPICS = [
  'Transformer attention mechanisms in NLP',
  'Diffusion models for image generation',
  'Graph neural networks for drug discovery',
  'Large language model alignment and safety',
  'Self-supervised learning in computer vision',
  'Retrieval-augmented generation for question answering',
  'Protein structure prediction with deep learning',
  'Federated learning for privacy-preserving AI',
]

// Status → color mapping
export const STATUS_COLORS = {
  done:    'text-green-400',
  running: 'text-blue-400',
  failed:  'text-red-400',
  pending: 'text-gray-500',
}
