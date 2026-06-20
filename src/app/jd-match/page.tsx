'use client'

import { useState } from 'react'
import Link from 'next/link'
import { analyzeJDMatch, type JDMatchResult } from '@/lib/ai'
import { ResumeUploader } from '@/components/ResumeUploader'
import { saveApplication, getResumes } from '@/lib/storage'

export default function JDMatchPage() {
  const [jd, setJd] = useState('')
  const [resume, setResume] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<JDMatchResult | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'input' | 'result'>('input')
  const resumes = getResumes()

  const handleAnalyze = async () => {
    if (!jd.trim() || !resume.trim()) {
      setError('请同时填写 JD 和简历')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    setSaved(false)
    try {
      const r = await analyzeJDMatch(jd, resume)
      setResult(r)
      setActiveTab('result')
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : '分析失败'
      setError(errMsg || '分析失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveToTracker = () => {
    if (!result) return
    // Extract company name from JD (simple heuristic)
    const companyMatch = jd.match(/(?:公司|企业|Company|Inc\.|Ltd\.|Corp\.?)\s*[:：]?\s*([^\n，。,]+)/)
    const company = companyMatch?.[1]?.trim() || '未识别公司'
    const titleMatch = jd.match(/(?:职位|岗位|title|Position)\s*[:：]?\s*([^\n，。,]+)/)
    const position = titleMatch?.[1]?.trim() || '未识别职位'

    saveApplication({
      company,
      position,
      source: '手动添加',
      jd: jd.slice(0, 2000),
      jdMatchScore: result.score,
      status: 'saved',
      appliedAt: new Date().toISOString(),
      notes: `匹配度: ${result.score}分\n${result.summary}`,
    })
    setSaved(true)
  }

  const scoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-400'
    if (s >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">← 返回首页</Link>
          <h1 className="text-2xl font-bold text-white mt-3">🔍 JD 智能匹配</h1>
          <p className="text-slate-400 mt-1 text-sm">把你的简历和 JD 一起扔进来，AI 帮你判断匹配度</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Tab bar */}
        <div className="flex gap-1 bg-slate-900/50 border border-slate-800 rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveTab('input')}
            className={`flex-1 py-2 text-sm rounded-lg transition-colors ${activeTab === 'input' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            📝 输入
          </button>
          <button
            onClick={() => setActiveTab('result')}
            disabled={!result}
            className={`flex-1 py-2 text-sm rounded-lg transition-colors ${activeTab === 'result' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'} ${!result ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            📊 分析结果
          </button>
        </div>

        {activeTab === 'input' && (
          <div className="space-y-4">
            {/* Quick load saved resume */}
            {resumes.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-slate-500 self-center">加载简历:</span>
                {resumes.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setResume(r.content)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-full transition-colors"
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-2">📋 岗位 JD</label>
              <textarea
                value={jd}
                onChange={e => setJd(e.target.value)}
                placeholder="粘贴岗位描述..."
                rows={8}
                className="w-full bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-y font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">👤 我的简历</label>
              <ResumeUploader onExtracted={(text, name) => setResume(text)} label="上传简历文件（PDF/TXT）" />
              <textarea
                value={resume}
                onChange={e => setResume(e.target.value)}
                placeholder="粘贴简历内容（或上传文件）..."
                rows={10}
                className="w-full bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-y font-mono text-sm mt-3"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-xl px-6 py-4 transition-colors text-lg"
            >
              {loading ? '🤔 AI 分析中...' : '🚀 分析匹配度'}
            </button>

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-300 text-sm">{error}</div>
            )}
          </div>
        )}

        {activeTab === 'result' && result && (
          <div className="space-y-4">
            {/* Score */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
              <div className={`text-6xl font-bold ${scoreColor(result.score)}`}>{result.score}</div>
              <div className="text-slate-500 text-sm mt-2">匹配分</div>
              <p className="text-slate-300 mt-4 text-lg">{result.summary}</p>
            </div>

            {/* Strengths */}
            <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-xl p-6">
              <h3 className="text-emerald-400 font-semibold mb-3">✅ 优势匹配</h3>
              <ul className="space-y-2">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-emerald-200/80 text-sm flex gap-2">
                    <span>•</span><span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Gaps */}
            <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-6">
              <h3 className="text-red-400 font-semibold mb-3">⚠️ 差距分析</h3>
              <ul className="space-y-2">
                {result.gaps.map((g, i) => (
                  <li key={i} className="text-red-200/80 text-sm flex gap-2">
                    <span>•</span><span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="bg-blue-900/20 border border-blue-800/40 rounded-xl p-6">
              <h3 className="text-blue-400 font-semibold mb-3">💡 改进建议</h3>
              <ul className="space-y-2">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="text-blue-200/80 text-sm flex gap-2">
                    <span>•</span><span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setActiveTab('input'); setJd(''); setResume(''); setResult(null) }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-3 transition-colors"
              >
                🔄 重新分析
              </button>
              <button
                onClick={handleSaveToTracker}
                disabled={saved}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl py-3 transition-colors"
              >
                {saved ? '✅ 已保存到看板' : '📋 保存到申请追踪'}
              </button>
            </div>

            <div className="text-center">
              <Link href="/gap-analysis" className="text-blue-400 hover:text-blue-300 text-sm">
                查看详细 Gap 分析 →
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'result' && !result && (
          <div className="text-center py-20 text-slate-500">
            <div className="text-4xl mb-4">📊</div>
            <p>还没有分析结果，去输入页面分析一个 JD 吧</p>
          </div>
        )}
      </main>
    </div>
  )
}
