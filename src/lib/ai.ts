// Browser-side DeepSeek API client
// API key is stored in localStorage, never on server

const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions'

export function getApiKey(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('job_copilot_deepseek_key') || ''
}

export function setApiKey(key: string) {
  localStorage.setItem('job_copilot_deepseek_key', key)
}

export function hasApiKey(): boolean {
  return !!getApiKey()
}

export async function callDeepSeek(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: { temperature?: number; max_tokens?: number }
): Promise<string> {
  const key = getApiKey()
  if (!key) throw new Error('请先设置 DeepSeek API Key')

  const res = await fetch(DEEPSEEK_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.max_tokens ?? 4096,
      stream: false,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API 错误 (${res.status}): ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// --- JD Match analysis ---
export interface JDMatchResult {
  score: number            // 0-100 match score
  summary: string          // one-line verdict
  strengths: string[]      // matching points
  gaps: string[]           // missing points
  recommendations: string[] // what to do
}

export async function analyzeJDMatch(jd: string, resume: string): Promise<JDMatchResult> {
  const systemPrompt = `你是一个资深的AI招聘分析师。你的任务是根据求职者的简历和岗位JD，输出一份结构化的匹配分析。
请严格按照以下JSON格式输出，不要包含任何其他内容：
{
  "score": 0-100的数字,
  "summary": "一句话总结匹配程度",
  "strengths": ["优势1", "优势2", ...],
  "gaps": ["差距1", "差距2", ...],
  "recommendations": ["建议1", "建议2", ...]
}`

  const userPrompt = `【岗位JD】
${jd}

【我的简历】
${resume}

请分析匹配度，输出JSON格式的结果。`

  const text = await callDeepSeek([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], { temperature: 0.2 })

  // Parse JSON from response (handle markdown-wrapped JSON)
  const jsonMatch = text.match(/\{[^]*\}/)
  if (!jsonMatch) throw new Error('AI 返回格式异常，请重试')
  return JSON.parse(jsonMatch[0])
}

// --- Gap Analysis ---
export interface GapAnalysis {
  technicalGaps: { skill: string; level: string; evidence: string; priority: 'high' | 'medium' | 'low' }[]
  experienceGaps: { area: string; description: string; suggestion: string }[]
  actionablePlan: string[]
}

export async function analyzeGaps(jd: string, resume: string): Promise<GapAnalysis> {
  const systemPrompt = `你是一个严谨的技术面试官。分析简历与JD之间的差距，给出有依据的评估。
请严格按照以下JSON格式输出：
{
  "technicalGaps": [
    {"skill": "技能名", "level": "需要达到的水平", "evidence": "JD中哪里提到", "priority": "high/medium/low"}
  ],
  "experienceGaps": [
    {"area": "领域", "description": "具体差距", "suggestion": "弥补建议"}
  ],
  "actionablePlan": ["行动1", "行动2", ...]
}`

  const text = await callDeepSeek([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `JD:
${jd}

简历:
${resume}` },
  ], { temperature: 0.2 })

  const jsonMatch = text.match(/\{[^]*\}/)
  if (!jsonMatch) throw new Error('AI 返回格式异常')
  return JSON.parse(jsonMatch[0])
}

// --- Resume Rewriter ---
export interface ResumeCustomization {
  summary: string
  experienceRewrite: string
  skillsHighlight: string[]
  coverLetter: string
}

export async function customizeResume(resume: string, jd: string): Promise<ResumeCustomization> {
  const systemPrompt = `你是一个专业的简历优化师。根据JD调整简历，突出匹配点。
请严格按照以下JSON格式输出：
{
  "summary": "个人简介（3行，突出与JD匹配的经验）",
  "experienceRewrite": "工作经历改写版本",
  "skillsHighlight": ["需要强调的技能1", "技能2"],
  "coverLetter": "求职信正文（300字以内）"
}`

  const text = await callDeepSeek([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `简历:
${resume}

目标JD:
${jd}` },
  ], { temperature: 0.3 })

  const jsonMatch = text.match(/\{[^]*\}/)
  if (!jsonMatch) throw new Error('AI 返回格式异常')
  return JSON.parse(jsonMatch[0])
}

// --- Company Research ---
export interface CompanyResearch {
  overview: string
  products: string[]
  culture: string
  recentNews: string[]
  interviewQuestions: { question: string; tips: string }[]
  score: number  // 匹配分
}

export async function researchCompany(companyName: string): Promise<CompanyResearch> {
  const systemPrompt = `你是一个职场研究顾问。根据公司名称，输出该公司的结构化画像。
请严格按照以下JSON格式输出（信息基于你知道的公开知识）：
{
  "overview": "公司概况（2-3句）",
  "products": ["核心产品1", "产品2"],
  "culture": "公司文化和技术氛围描述",
  "recentNews": ["近期动态1", "动态2"],
  "interviewQuestions": [
    {"question": "可能的面试题", "tips": "答题建议"}
  ],
  "score": 0-100的匹配参考分
}`

  const text = await callDeepSeek([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `公司名称: ${companyName}
请输出公司画像和研究报告。` },
  ], { temperature: 0.4 })

  const jsonMatch = text.match(/\{[^]*\}/)
  if (!jsonMatch) throw new Error('AI 返回格式异常')
  return JSON.parse(jsonMatch[0])
}
