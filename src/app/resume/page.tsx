'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ApiKeySetup } from '@/components/ApiKeySetup'
import { customizeResume, hasApiKey, type ResumeCustomization } from '@/lib/ai'
import { saveResume, getResumes, deleteResume } from '@/lib/storage'

export default function ResumePage() {
  const [resume, setResume] = useState('')
  const [jd, setJd] = useState('')
  const [result, setResult] = useState<ResumeCustomization | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [resumeName, setResumeName] = useState('')
  const resumes = getResumes()

  const handleRewrite = async () => {
    if (!resume.trim() || !jd.trim()) { setError('请同时填写简历和 JD'); return }
    setLoading(true); setError(''); setResult(null); setSaved(false)
    try {
      const r = await customizeResume(resume, jd)
      setResult(r)
    } catch (e: any) { setError(e.message || '改写失败') }
    finally { setLoading(false) }
  }

  const handleSaveResume = () => {
    const name = resumeName.trim() || `简历 ${new Date().toLocaleDateString('zh-CN')}`
    saveResume(name, resume)
    setSaved(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <ApiKeySetup />
      <header className="border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">← 返回首页</Link>
          <h1 className="text-2xl font-bold text-white mt-3">📝 简历 & 求职信定制</h1>
          <p className="text-slate-400 mt-1 text-sm">按 JD 自动改写简历，生成 Cover Letter</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Saved resumes */}
        {resumes.length > 0 && (
          <div className="mb-6 bg-slate-900/30 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm text-slate-400 mb-3">已保存的简历</h3>
            <div className="flex gap-2 flex-wrap">
              {resumes.map(r => (
                <div key={r.id} className="flex items-center gap-1">
                  <button onClick={() => { setResume(r.content); setResumeName(r.name) }}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors">
                    {r.name}
                  </button>
                  <button onClick={() => { deleteResume(r.id); window.location.reload() }}
                    className="text-xs text-slate-600 hover:text-red-400 transition-colors">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">👤 我的简历</label>
              <textarea value={resume} onChange={e => setResume(e.target.value)} rows={10}
                className="w-full bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-y font-mono text-sm"
                placeholder="粘贴简历..." />
              <div className="flex gap-2 mt-2">
                <input value={resumeName} onChange={e => setResumeName(e.target.value)}
                  placeholder="简历名称（可选）"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500" />
                <button onClick={handleSaveResume} disabled={!resume.trim() || saved}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-slate-300 text-sm px-3 py-1.5 rounded-lg transition-colors">
                  {saved ? '✅ 已保存' : '💾 保存'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">🎯 目标 JD</label>
              <textarea value={jd} onChange={e => setJd(e.target.value)} rows={8}
                className="w-full bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-y font-mono text-sm"
                placeholder="粘贴 JD..." />
            </div>
            <button onClick={handleRewrite} disabled={loading || !hasApiKey()}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-xl px-6 py-4 transition-colors">
              {loading ? '✍️ AI 改写中...' : '✍️ 定制简历 & 求职信'}
            </button>
            {error && <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-300 text-sm">{error}</div>}
          </div>

          {/* Result */}
          <div className="space-y-4">
            {!result && !loading && (
              <div className="text-center py-20 text-slate-500 border border-dashed border-slate-700 rounded-xl">
                <div className="text-4xl mb-4">📝</div>
                <p>填入简历和目标 JD，AI 帮你定制</p>
              </div>
            )}
            {loading && <div className="text-center py-20 text-slate-400"><div className="animate-spin text-4xl mb-4">⏳</div><p>AI 正在优化...</p></div>}
            {result && (
              <>
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
                  <h3 className="text-emerald-400 font-semibold mb-3">📋 个人简介</h3>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{result.summary}</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
                  <h3 className="text-emerald-400 font-semibold mb-3">💼 工作经历（改写版）</h3>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{result.experienceRewrite}</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
                  <h3 className="text-emerald-400 font-semibold mb-3">🎯 需要强调的技能</h3>
                  <div className="flex gap-2 flex-wrap">
                    {result.skillsHighlight.map((s, i) => (
                      <span key={i} className="bg-emerald-900/40 text-emerald-300 text-xs px-3 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
                  <h3 className="text-emerald-400 font-semibold mb-3">✉️ 求职信</h3>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{result.coverLetter}</p>
                  <button onClick={() => navigator.clipboard.writeText(result.coverLetter)}
                    className="mt-3 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg transition-colors">
                    📋 复制
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
