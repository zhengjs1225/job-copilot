'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ApiKeySetup } from '@/components/ApiKeySetup'
import { researchCompany, hasApiKey, type CompanyResearch } from '@/lib/ai'

export default function CompanyPage() {
  const [company, setCompany] = useState('')
  const [result, setResult] = useState<CompanyResearch | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleResearch = async () => {
    if (!company.trim()) { setError('请输入公司名称'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const r = await researchCompany(company.trim())
      setResult(r)
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : '研究失败'
      setError(errMsg)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <ApiKeySetup />
      <header className="border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">← 返回首页</Link>
          <h1 className="text-2xl font-bold text-white mt-3">🏢 公司研究 Agent</h1>
          <p className="text-slate-400 mt-1 text-sm">输入公司名，AI 生成画像 + 面试题</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="flex gap-3 mb-8">
          <input value={company} onChange={e => setCompany(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleResearch()}
            placeholder="输入公司名称（如：字节跳动、阿里巴巴、Tencent...）"
            className="flex-1 bg-slate-900/70 border border-slate-700 rounded-xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 text-lg" />
          <button onClick={handleResearch} disabled={loading || !hasApiKey() || !company.trim()}
            className="bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-xl px-8 py-4 transition-colors shrink-0">
            {loading ? '🔍' : '🔍 研究'}
          </button>
        </div>
        {error && <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-300 text-sm mb-6">{error}</div>}

        {result && (
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-800/40 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">{company}</h2>
                {result.score > 0 && (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-400">{result.score}</div>
                    <div className="text-xs text-slate-500">匹配参考</div>
                  </div>
                )}
              </div>
              <p className="text-slate-300 mt-3">{result.overview}</p>
            </div>

            {/* Products */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-slate-400 font-semibold mb-3">📦 核心产品</h3>
              <div className="flex gap-2 flex-wrap">
                {result.products.map((p, i) => (
                  <span key={i} className="bg-slate-800 text-slate-300 text-sm px-3 py-1.5 rounded-lg">{p}</span>
                ))}
              </div>
            </div>

            {/* Culture */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-slate-400 font-semibold mb-3">🏛️ 公司文化</h3>
              <p className="text-slate-300 text-sm">{result.culture}</p>
            </div>

            {/* Recent News */}
            {result.recentNews.length > 0 && (
              <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-slate-400 font-semibold mb-3">📰 近期动态</h3>
                <ul className="space-y-2">
                  {result.recentNews.map((n, i) => (
                    <li key={i} className="text-slate-300 text-sm flex gap-2">
                      <span className="text-orange-400">•</span><span>{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Interview Questions */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-slate-400 font-semibold mb-3">🎤 预测面试题</h3>
              <div className="space-y-3">
                {result.interviewQuestions.map((q, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-white font-medium text-sm">Q{i + 1}: {q.question}</p>
                    <p className="text-slate-400 text-xs mt-2">💡 {q.tips}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setCompany(''); setResult(null) }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-3 transition-colors">
                🔄 研究另一家
              </button>
              <Link href="/tracker"
                className="flex-1 text-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 transition-colors">
                📋 去申请追踪
              </Link>
            </div>
          </div>
        )}

        {!result && !loading && (
          <div className="text-center py-20 text-slate-500">
            <div className="text-4xl mb-4">🏢</div>
            <p>输入公司名称，AI 帮你做功课</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-20 text-slate-400">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p>AI 正在研究 {company}...</p>
          </div>
        )}
      </main>
    </div>
  )
}
