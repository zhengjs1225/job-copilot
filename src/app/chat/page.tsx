'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { callAI } from '@/lib/ai'
import { getApplications, getApplicationStats } from '@/lib/storage'
import { buildSystemPrompt } from '@/lib/prompt'
import { computeHealthScore, type HealthScore } from '@/lib/health'
import { ResumeUploader } from '@/components/ResumeUploader'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id: string
}

interface Conversation {
  id: string
  title: string
  messages: { role: string; content: string; id: string }[]
  createdAt: string
}

// Build welcome message with contextual analysis
function buildWelcomeMessage(): Message {
  if (typeof window === 'undefined') return WELCOME_FRESH

  const stats = getApplicationStats()
  const apps = getApplications()
  const health = computeHealthScore()

  if (stats.total === 0) return WELCOME_FRESH

  // Has data → proactive analysis
  const latestApps = apps.slice(-3).map(a =>
    `- ${a.company} · ${a.position} · ${a.status}${a.jdMatchScore ? ` · 匹配 ${a.jdMatchScore}分` : ''}`
  ).join('\n')

  const content = `# 👋 欢迎回来！这是你的求职简报

## 📊 求职健康分: **${health.overall}/100**
> 漏斗 ${health.funnel} | 匹配质量 ${health.quality} | 活跃度 ${health.momentum}

## 📋 近期投递
${latestApps || '（暂无）'}

## 🎯 建议
${health.tips.map(t => `- ${t}`).join('\n')}

**有什么我可以帮你的？** 👇`

  return { role: 'assistant', content, id: `welcome-${Date.now()}` }
}

const WELCOME_FRESH: Message = {
  role: 'assistant',
  content: `# 👋 你好！我是 Job Copilot

你的 AI **求职操作系统**，不是普通的聊天机器人：

🔍 **JD 匹配** — 贴 JD + 简历，分析匹配度 + 差距
📊 **竞品分析** — 把你和市场上的候选人对比
🏢 **公司情报** — 输入公司名，出画像 + 薪资 + 面试策略
📋 **求职看板** — 跟踪漏斗、算转化率、主动给建议

**第一步：** 贴一个你感兴趣的 JD 和你的简历，我帮你分析！
或者直接告诉我你想做什么。👇`,
  id: 'welcome',
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([buildWelcomeMessage()])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('jc_conversations') || '[]') } catch { return [] }
  })
  const [currentConvId, setCurrentConvId] = useState<string>('')
  const [showSidebar, setShowSidebar] = useState(false)
  const [health, setHealth] = useState<HealthScore>({ overall: 0, funnel: 0, quality: 0, momentum: 0, tips: [] })
  const [showUploader, setShowUploader] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Update health score on mount and when data changes
  useEffect(() => {
    setHealth(computeHealthScore())
  }, [])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const saveConversation = (msgs: Message[], convId?: string) => {
    const id = convId || crypto.randomUUID?.() || `${Date.now()}`
    const title = msgs.find(m => m.role === 'user')?.content.slice(0, 40) || '新对话'
    const conv: Conversation = { id, title, messages: msgs, createdAt: new Date().toISOString() }
    const existing = conversations.filter(c => c.id !== id)
    const updated = [conv, ...existing].slice(0, 30)
    setConversations(updated)
    localStorage.setItem('jc_conversations', JSON.stringify(updated))
    return id
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const userMsg: Message = { role: 'user', content: text, id: `${Date.now()}` }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)

    let convId = currentConvId
    if (!convId || messages.filter(m => m.role === 'user').length === 0) {
      convId = saveConversation(newMessages)
      setCurrentConvId(convId)
    }

    setLoading(true)

    try {
      const systemPrompt = buildSystemPrompt(getContextData())
      const apiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: systemPrompt },
        ...newMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ]

      const reply = await callAI(apiMessages, { temperature: 0.5, max_tokens: 4096 })

      const assistantMsg: Message = { role: 'assistant', content: reply, id: `${Date.now()}-reply` }
      const finalMessages = [...newMessages, assistantMsg]
      setMessages(finalMessages)
      saveConversation(finalMessages, convId)

      // Refresh health after new data
      setHealth(computeHealthScore())
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : '请求失败'
      const errorMsg: Message = { role: 'assistant', content: `❌ **出错了**：${errMsg}`, id: `${Date.now()}-error` }
      setMessages([...newMessages, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleNewChat = () => {
    setMessages([buildWelcomeMessage()])
    setHealth(computeHealthScore())
    setCurrentConvId('')
    setInput('')
    setShowUploader(false)
    inputRef.current?.focus()
  }

  const handleResumeUpload = (text: string, fileName: string) => {
    setShowUploader(false)
    const msg = `这是我的简历（${fileName}）：\n\n${text.slice(0, 3000)}\n\n请分析这份简历，告诉我怎么样`
    setInput(msg)
    // Trigger send after state update
    setTimeout(() => handleSend(), 50)
  }

  const loadConversation = (conv: Conversation) => {
    setMessages(conv.messages as Message[])
    setCurrentConvId(conv.id)
    setShowSidebar(false)
    setHealth(computeHealthScore())
  }

  const deleteConversation = (id: string) => {
    const updated = conversations.filter(c => c.id !== id)
    setConversations(updated)
    localStorage.setItem('jc_conversations', JSON.stringify(updated))
    if (currentConvId === id) handleNewChat()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const renderContent = (content: string) => {
    const html = content
      .replace(/### (.+)/g, '<h3 class="text-lg font-semibold text-white mt-4 mb-2">$1</h3>')
      .replace(/## (.+)/g, '<h2 class="text-xl font-bold text-white mt-5 mb-2">$1</h2>')
      .replace(/# (.+)/g, '<h1 class="text-2xl font-bold text-white mt-5 mb-3">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-blue-300">$1</strong>')
      .replace(/\n- (.+)/g, '<li class="ml-4 text-slate-300">• $1</li>')
      .replace(/\n\d+\. (.+)/g, (_, p1) => `<li class="ml-4 text-slate-300 list-decimal">${p1}</li>`)
      .replace(/\n/g, '<br/>')
    return <div dangerouslySetInnerHTML={{ __html: html }} />
  }

  // Health score color
  const scoreColor = (s: number) => {
    if (s >= 70) return 'text-emerald-400'
    if (s >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  const stats = getApplicationStats()

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-80 bg-slate-950/95 border-r border-slate-800 transition-transform duration-200 flex flex-col`}>
        <div className="p-4 border-b border-slate-800">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← 首页</Link>
          <h2 className="text-lg font-bold text-white mt-1">💬 Job Copilot</h2>
        </div>

        <button onClick={handleNewChat}
          className="mx-3 mt-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">
          + 新对话
        </button>

        {/* Health Score Card */}
        <div className="mx-3 mt-3 p-4 bg-slate-900/50 border border-slate-700 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">求职健康</span>
            <span className={`text-2xl font-bold ${scoreColor(health.overall)}`}>{health.overall}</span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>📊 漏斗</span><span>{health.funnel}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${health.funnel >= 70 ? 'bg-emerald-500' : health.funnel >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${health.funnel}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>🎯 匹配质量</span><span>{health.quality}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${health.quality >= 70 ? 'bg-blue-500' : health.quality >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${health.quality}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>⚡ 活跃度</span><span>{health.momentum}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${health.momentum >= 70 ? 'bg-purple-500' : health.momentum >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${health.momentum}%` }} />
              </div>
            </div>
          </div>

          {/* Tips */}
          {health.tips.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800">
              {health.tips.slice(0, 2).map((t, i) => (
                <p key={i} className="text-xs text-slate-400 mb-1">{t}</p>
              ))}
            </div>
          )}
        </div>

        {/* Stats Mini */}
        <div className="mx-3 mt-3 p-3 bg-slate-900/30 border border-slate-700/50 rounded-lg">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div><span className="text-white font-bold">{stats.total}</span><br/><span className="text-slate-500">投递</span></div>
            <div><span className="text-purple-400 font-bold">{stats.interviews}</span><br/><span className="text-slate-500">面试</span></div>
            <div><span className="text-emerald-400 font-bold">{stats.offers}</span><br/><span className="text-slate-500">Offer</span></div>
            <div><span className="text-yellow-400 font-bold">{stats.conversionRate}%</span><br/><span className="text-slate-500">转化</span></div>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {conversations.map(conv => (
            <div key={conv.id} className="group flex items-center">
              <button onClick={() => loadConversation(conv)}
                className={`flex-1 text-left text-sm py-2 px-3 rounded-lg transition-colors truncate ${
                  currentConvId === conv.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}>
                {conv.title}
              </button>
              <button onClick={() => deleteConversation(conv.id)}
                className="opacity-0 group-hover:opacity-100 text-xs text-slate-600 hover:text-red-400 px-2 transition-all">✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Overlay for mobile */}
      {showSidebar && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setShowSidebar(false)} />}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="border-b border-slate-800 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setShowSidebar(!showSidebar)} className="lg:hidden text-slate-400 hover:text-white text-xl">☰</button>
          <span className="text-xs text-slate-500">求职操作系统</span>
          <div className="flex-1" />
          <span className={`text-xs font-bold ${scoreColor(health.overall)}`}>健康 {health.overall}</span>
          <span className="text-xs text-emerald-500">✅ AI 已就绪</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm shrink-0 mt-1">🤖</div>
                )}
                <div className={`max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-3'
                    : 'text-slate-200'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="text-sm leading-relaxed">{renderContent(msg.content)}</div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm shrink-0 mt-1">👤</div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm shrink-0 mt-1">🤖</div>
                <div className="bg-slate-800/50 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Upload popup */}
        {showUploader && (
          <div className="border-t border-slate-800 px-4 py-4 bg-slate-900/50">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">📄 上传简历</span>
                <button onClick={() => setShowUploader(false)} className="text-slate-500 hover:text-white text-sm">✕</button>
              </div>
              <ResumeUploader onExtracted={handleResumeUpload} />
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-slate-800 px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-colors">
              <button onClick={() => setShowUploader(!showUploader)}
                className="text-slate-400 hover:text-blue-300 transition-colors px-2 py-2 text-lg shrink-0" title="上传简历">
                📎
              </button>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="说点什么... 比如：分析这个JD / 研究字节跳动 / 我的求职状态怎么样"
                rows={1}
                className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none resize-none text-sm max-h-32"
                style={{ minHeight: '24px' }}
                onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 128)}px` }}
                disabled={loading}
              />
              <button onClick={handleSend} disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg px-4 py-2 text-sm transition-colors shrink-0">
                {loading ? '⏳' : '发送'}
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-2 text-center">Job Copilot · Cloudflare Worker 代理 · 开箱即用</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function getContextData(): string {
  if (typeof window === 'undefined') return ''
  const apps = getApplications()
  const stats = getApplicationStats()
  const health = computeHealthScore()
  
  const appsDetail = apps.slice(-8).map(a =>
    `- ${a.company} · ${a.position} · 状态: ${a.status}${a.jdMatchScore ? ` · 匹配分: ${a.jdMatchScore}` : ''}${a.source ? ` · 来源: ${a.source}` : ''}`
  ).join('\n')

  return `
## 求职总览
- 投递总数: ${stats.total}
- 已投: ${stats.applied}
- 面试: ${stats.interviews}
- Offer: ${stats.offers}
- 被拒: ${stats.rejects}
- 转化率: ${stats.conversionRate}%

## 求职健康分
- 综合: ${health.overall}/100
- 漏斗健康度: ${health.funnel}
- 匹配质量: ${health.quality}
- 活跃度: ${health.momentum}
- 建议: ${health.tips.join('; ')}

## 最近投递
${appsDetail || '（暂无投递记录）'}
`
}
