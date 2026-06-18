'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ApiKeySetup } from '@/components/ApiKeySetup'
import { callDeepSeek, hasApiKey } from '@/lib/ai'
import { getApplications, getApplicationStats } from '@/lib/storage'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id: string
}

// System prompt defining Job Copilot's capabilities
const SYSTEM_PROMPT = `你是 Job Copilot，一个专业的 AI 求职助手。你的任务是帮助用户找到更好的工作。

## 你的能力

### 1. JD 智能匹配
- 分析岗位 JD 与用户简历的匹配度
- 输出匹配分(0-100)、优势、差距、改进建议
- 格式清晰，使用标题和列表

### 2. Gap 分析
- 逐项评估用户技能与 JD 要求的差距
- 给出优先级(高/中/低)和具体依据
- 提供可执行的行动计划

### 3. 简历定制
- 根据目标 JD 改写简历
- 突出与 JD 匹配的经验和技能
- 可以生成 Cover Letter

### 4. 公司研究
- 根据公司名称提供公司画像
- 核心产品、公司文化、可能的面试题

### 5. 申请追踪
- 用户可以查询当前投递状态
- 可以记录新的投递
- 统计面试转化率

## 重要规则
- 回答要结构化，用 Markdown 格式
- 用 emoji 让回复更友好
- 主动追问细节（比如让用户提供简历、JD、公司名）
- 不要一次性问太多问题，每次聚焦一个
- 当用户说要分析 JD 时，让 TA 粘贴 JD 和简历
- 当用户说要研究公司时，问公司名
- 当用户问投递进度时，查 localStorage 看板数据
- 如果用户没有提供必要信息，主动引导

请开始和用户的对话吧。第一个消息用欢迎语开场。`

// Saved conversations
interface Conversation {
  id: string
  title: string
  messages: { role: string; content: string; id: string }[]
  createdAt: string
}

const WELCOME_MSG: Message = {
  role: 'assistant',
  content: `# 👋 你好！我是 Job Copilot

你的 AI 求职副驾驶，可以帮你：

🔍 **JD 智能匹配** — 贴 JD + 简历，我帮你分析匹配度
📊 **Gap 分析** — 逐项评估差距，给出行动计划
📝 **简历定制** — 按目标 JD 改写简历 + Cover Letter
🏢 **公司研究** — 输入公司名，我出画像 + 面试题
📋 **申请追踪** — 查投递进度、转化率

**开始吧！你想先干什么？** 👇`,
  id: 'welcome',
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('jc_conversations') || '[]') } catch { return [] }
  })
  const [currentConvId, setCurrentConvId] = useState<string>('')
  const [showSidebar, setShowSidebar] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const saveConversation = (msgs: Message[], convId?: string) => {
    const id = convId || crypto.randomUUID?.() || `${Date.now()}`
    const title = msgs.find(m => m.role === 'user')?.content.slice(0, 40) || '新对话'
    const conv: Conversation = {
      id,
      title,
      messages: msgs,
      createdAt: new Date().toISOString(),
    }
    const existing = conversations.filter(c => c.id !== id)
    const updated = [conv, ...existing].slice(0, 30) // keep last 30
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

    // If this is the first user msg, create conversation
    let convId = currentConvId
    if (!convId || messages.filter(m => m.role === 'user').length === 0) {
      convId = saveConversation(newMessages)
      setCurrentConvId(convId)
    }

    setLoading(true)

    try {
      // Build conversation history for API
      const apiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: SYSTEM_PROMPT + getContextData() },
        ...newMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ]

      const reply = await callDeepSeek(apiMessages, { temperature: 0.5, max_tokens: 4096 })

      const assistantMsg: Message = {
        role: 'assistant',
        content: reply,
        id: `${Date.now()}-reply`,
      }
      const finalMessages = [...newMessages, assistantMsg]
      setMessages(finalMessages)
      saveConversation(finalMessages, convId)
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : '请求失败，请重试'
      const errorMsg: Message = {
        role: 'assistant',
        content: `❌ **出错了**：${errMsg}`,
        id: `${Date.now()}-error`,
      }
      setMessages([...newMessages, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleNewChat = () => {
    const welcome: Message = {
      role: 'assistant',
      content: `# 👋 你好！我是 Job Copilot

你的 AI 求职副驾驶，可以帮你：

🔍 **JD 智能匹配** — 贴 JD + 简历，我帮你分析匹配度
📊 **Gap 分析** — 逐项评估差距，给出行动计划
📝 **简历定制** — 按目标 JD 改写简历 + Cover Letter
🏢 **公司研究** — 输入公司名，我出画像 + 面试题
📋 **申请追踪** — 查投递进度、转化率

**开始吧！你想先干什么？** 👇`,
      id: 'welcome',
    }
    setMessages([welcome])
    setCurrentConvId('')
    setInput('')
    inputRef.current?.focus()
  }

  const loadConversation = (conv: Conversation) => {
    setMessages(conv.messages as Message[])
    setCurrentConvId(conv.id)
    setShowSidebar(false)
  }

  const deleteConversation = (id: string) => {
    const updated = conversations.filter(c => c.id !== id)
    setConversations(updated)
    localStorage.setItem('jc_conversations', JSON.stringify(updated))
    if (currentConvId === id) handleNewChat()
  }

  // Handle Enter to send (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Format message content with simple markdown rendering
  const renderContent = (content: string) => {
    // Convert markdown headings, bold, lists, code
    const html = content
      .replace(/### (.+)/g, '<h3 class="text-lg font-semibold text-white mt-4 mb-2">$1</h3>')
      .replace(/## (.+)/g, '<h2 class="text-xl font-bold text-white mt-5 mb-2">$1</h2>')
      .replace(/# (.+)/g, '<h1 class="text-2xl font-bold text-white mt-5 mb-3">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\n- (.+)/g, '<li class="ml-4 text-slate-300">• $1</li>')
      .replace(/\n\d\. (.+)/g, (match, p1) => `<li class="ml-4 text-slate-300 list-decimal">${p1}</li>`)
      .replace(/\n/g, '<br/>')

    return <div dangerouslySetInnerHTML={{ __html: html }} />
  }

  const stats = getApplicationStats()

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex overflow-hidden">
      <ApiKeySetup />

      {/* Sidebar */}
      <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-72 bg-slate-950/95 border-r border-slate-800 transition-transform duration-200 flex flex-col`}>
        <div className="p-4 border-b border-slate-800">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← 返回首页</Link>
          <h2 className="text-lg font-bold text-white mt-1">💬 Job Copilot</h2>
        </div>

        <button onClick={handleNewChat}
          className="mx-3 mt-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">
          + 新对话
        </button>

        {/* Stats mini */}
        <div className="mx-3 mt-3 p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
          <div className="text-xs text-slate-500 mb-1">📊 求职数据</div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div><span className="text-white font-bold">{stats.total}</span> <span className="text-slate-500">投递</span></div>
            <div><span className="text-purple-400 font-bold">{stats.interviews}</span> <span className="text-slate-500">面试</span></div>
            <div><span className="text-emerald-400 font-bold">{stats.offers}</span> <span className="text-slate-500">Offer</span></div>
            <div><span className="text-yellow-400 font-bold">{stats.conversionRate}%</span> <span className="text-slate-500">转化</span></div>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {conversations.map(conv => (
            <div key={conv.id} className="group flex items-center">
              <button
                onClick={() => loadConversation(conv)}
                className={`flex-1 text-left text-sm py-2 px-3 rounded-lg transition-colors truncate ${
                  currentConvId === conv.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {conv.title}
              </button>
              <button
                onClick={() => deleteConversation(conv.id)}
                className="opacity-0 group-hover:opacity-100 text-xs text-slate-600 hover:text-red-400 px-2 transition-all"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Overlay for mobile */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setShowSidebar(false)} />
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="border-b border-slate-800 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="lg:hidden text-slate-400 hover:text-white text-xl"
          >
            ☰
          </button>
          <div className="flex-1" />
          {!hasApiKey() && (
            <span className="text-xs text-yellow-400">⚠️ 未设置 API Key</span>
          )}
          {hasApiKey() && (
            <span className="text-xs text-emerald-500">✅ API Key 已配置</span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm shrink-0 mt-1">🤖</div>
                )}
                <div className={`max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-3'
                    : 'text-slate-200 prose prose-invert'
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
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm shrink-0 mt-1">🤖</div>
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

        {/* Input area */}
        <div className="border-t border-slate-800 px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="说点什么... （比如：我适合这个岗位吗？帮我研究一下字节跳动）"
                rows={1}
                className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none resize-none text-sm max-h-32"
                style={{ minHeight: '24px' }}
                onInput={e => {
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = `${Math.min(el.scrollHeight, 128)}px`
                }}
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg px-4 py-2 text-sm transition-colors shrink-0"
              >
                {loading ? '⏳' : '发送'}
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-2 text-center">
              Job Copilot 使用 DeepSeek API · 你的 Key 只存在本地
            </p>
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
  return `\n\n## 当前用户数据\n- 投递总数: ${stats.total}\n- 已投: ${stats.applied}\n- 面试中: ${stats.interviews}\n- Offer: ${stats.offers}\n- 被拒: ${stats.rejects}\n- 转化率: ${stats.conversionRate}%\n\n最近投递:\n${apps.slice(-5).map(a => `- ${a.company} · ${a.position} · 状态: ${a.status} · 匹配分: ${a.jdMatchScore ?? '未评估'}`).join('\n')}`
}
