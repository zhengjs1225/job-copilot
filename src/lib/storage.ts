// Browser localStorage-based storage (no Supabase needed for now)

export interface Application {
  id: string
  company: string
  position: string
  source: string  // where you found it
  jd: string
  jdMatchScore?: number
  status: 'saved' | 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
  appliedAt: string   // ISO date
  updatedAt: string
  notes: string
}

export interface Resume {
  id: string
  name: string
  content: string
  createdAt: string
}

const APPS_KEY = 'job_copilot_applications'
const RESUMES_KEY = 'job_copilot_resumes'
const SETTINGS_KEY = 'job_copilot_settings'

// --- Applications ---
export function getApplications(): Application[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(APPS_KEY) || '[]')
  } catch { return [] }
}

export function saveApplication(app: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Application {
  const apps = getApplications()
  const now = new Date().toISOString()
  const newApp: Application = {
    ...app,
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    appliedAt: app.appliedAt || now,
    updatedAt: now,
  }
  apps.push(newApp)
  localStorage.setItem(APPS_KEY, JSON.stringify(apps))
  return newApp
}

export function updateApplication(id: string, updates: Partial<Application>): Application | null {
  const apps = getApplications()
  const idx = apps.findIndex(a => a.id === id)
  if (idx === -1) return null
  apps[idx] = { ...apps[idx], ...updates, updatedAt: new Date().toISOString() }
  localStorage.setItem(APPS_KEY, JSON.stringify(apps))
  return apps[idx]
}

export function deleteApplication(id: string) {
  const apps = getApplications().filter(a => a.id !== id)
  localStorage.setItem(APPS_KEY, JSON.stringify(apps))
}

// --- Stats ---
export function getApplicationStats() {
  const apps = getApplications()
  const total = apps.length
  const applied = apps.filter(a => a.status !== 'saved').length
  const interviews = apps.filter(a => a.status === 'interview').length
  const offers = apps.filter(a => a.status === 'offer').length
  const rejects = apps.filter(a => a.status === 'rejected').length
  return {
    total,
    applied,
    interviews,
    offers,
    rejects,
    conversionRate: applied > 0 ? ((offers + interviews) / applied * 100).toFixed(1) : '0',
  }
}

// --- Resumes ---
export function getResumes(): Resume[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RESUMES_KEY) || '[]')
  } catch { return [] }
}

export function saveResume(name: string, content: string): Resume {
  const resumes = getResumes()
  const newResume: Resume = {
    id: crypto.randomUUID?.() || `${Date.now()}`,
    name,
    content,
    createdAt: new Date().toISOString(),
  }
  resumes.push(newResume)
  localStorage.setItem(RESUMES_KEY, JSON.stringify(resumes))
  return newResume
}

export function deleteResume(id: string) {
  const resumes = getResumes().filter(r => r.id !== id)
  localStorage.setItem(RESUMES_KEY, JSON.stringify(resumes))
}
