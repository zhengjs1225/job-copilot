'use client'

import { useState } from 'react'
import Link from 'next/link'
import { analyzeGaps, type GapAnalysis } from '@/lib/ai'

export default function GapAnalysisPage() {
  const [jd, setJd] = useState('')
  const [resume, setResume] = useState('')
  const [result, setResult] = useState<GapAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!jd.trim() || !resume.trim()) { setError('请同时填写 JD 和简历'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const r = await analyzeGaps(jd, resume)
      setResult(r)
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : '分析失败'
      setError(errMsg)
    } finally { setLoading(false) }
  }

  const priorityColor = (p: string) => {
    if (p === 'high') return 'border-red-800/40 bg-red-900/20'
    if (p === 'medium') return 'border-yellow-800/40 bg-yellow-900/20'
    return 'border-blue-800/40 bg-blue-900/20'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">← 返回首页</Link>
          <h1 className="text-2xl font-bold text-white mt-3">📊 Gap 分析</h1>
          <p className="text-slate-400 mt-1 text-sm">严谨的技术评估：缺什么、差多少、怎么补</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">🎯 JD</label>
              <textarea value={jd} onChange={e => setJd(e.target.value)} rows={8}
                className="w-full bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 resize-y font-mono text-sm"
                placeholder="粘贴 JD..." />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">👤 简历</label>
              <textarea value={resume} onChange={e => setResume(e.target.value)} rows={10}
                className="w-full bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 resize-y font-mono text-sm"
                placeholder="粘贴简历..." />
            </div>
            <button onClick={handleAnalyze} disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-xl px-6 py-4 transition-colors">
              {loading ? '🔬 分析中...' : '🔬 开始 Gap 分析'}
            </button>
            {error && <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-300 text-sm">{error}</div>}
          </div>

          {/* Results */}
          <div className="space-y-4">
            {!result && !loading && (
              <div className="text-center py-20 text-slate-500 border border-dashed border-slate-700 rounded-xl">
                <div className="text-4xl mb-4">📊</div>
                <p>输入 JD 和简历，点击分析</p>
                <p className="text-xs text-slate-600 mt-2">Gap 分析会提供有依据的评估</p>
              </div>
            )}
            {loading && (
              <div className="text-center py-20 text-slate-400">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p>AI 正在严谨评估...</p>
              </div>
            )}
            {result && (
              <>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">🔧 技能差距</h3>
                {result.technicalGaps.map((g, i) => (
                  <div key={i} className={`border rounded-xl p-4 ${priorityColor(g.priority)}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white">{g.skill}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        g.priority === 'high' ? 'bg-red-800/50 text-red-300' :
                        g.priority === 'medium' ? 'bg-yellow-800/50 text-yellow-300' : 'bg-blue-800/50 text-blue-300'
                      }`}>{g.priority === 'high' ? '高优先级' : g.priority === 'medium' ? '中' : '低'}</span>
                    </div>
                    <p className="text-sm text-slate-400">需要: {g.level}</p>
                    <p className="text-xs text-slate-500 mt-1">依据: {g.evidence}</p>
                  </div>
                ))}

                {result.experienceGaps.length > 0 && (
                  <>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mt-4">📋 经验差距</h3>
                    {result.experienceGaps.map((g, i) => (
                      <div key={i} className="border border-slate-700 bg-slate-900/30 rounded-xl p-4">
                        <p className="font-medium text-white">{g.area}</p>
                        <p className="text-sm text-slate-400 mt-1">{g.description}</p>
                        <p className="text-xs text-blue-300 mt-2">💡 {g.suggestion}</p>
                      </div>
                    ))}
                  </>
                )}

                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mt-4">🎯 行动计划</h3>
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                  <ol className="space-y-2">
                    {result.actionablePlan.map((a, i) => (
                      <li key={i} className="text-slate-300 text-sm flex gap-2">
                        <span className="text-blue-400 shrink-0">{i + 1}.</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="flex gap-3 mt-4">
                  <Link href="/resume"
                    className="flex-1 text-center bg-teal-600 hover:bg-teal-500 text-white rounded-xl py-3 transition-colors text-sm">
                    📝 去定制简历
                  </Link>
                  <Link href="/company"
                    className="flex-1 text-center bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-3 transition-colors text-sm">
                    🏢 研究公司
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
