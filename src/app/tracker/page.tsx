'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getApplications, saveApplication, updateApplication, deleteApplication, getApplicationStats, type Application } from '@/lib/storage'

const STATUSES = [
  { key: 'saved', label: '📌 收藏', color: 'border-slate-600 bg-slate-900/50' },
  { key: 'applied', label: '📤 已投', color: 'border-blue-600 bg-blue-900/20' },
  { key: 'screening', label: '🔍 筛选中', color: 'border-yellow-600 bg-yellow-900/20' },
  { key: 'interview', label: '🎯 面试中', color: 'border-purple-600 bg-purple-900/20' },
  { key: 'offer', label: '🎉 Offer', color: 'border-emerald-600 bg-emerald-900/20' },
  { key: 'rejected', label: '❌ 已拒', color: 'border-red-600 bg-red-900/20' },
  { key: 'withdrawn', label: '⏸️ 撤回', color: 'border-slate-600 bg-slate-900/30' },
] as const

export default function TrackerPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [showForm, setShowForm] = useState(false)
  const [stats, setStats] = useState({ total: 0, applied: 0, interviews: 0, offers: 0, rejects: 0, conversionRate: '0' })

  // Form state
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [source, setSource] = useState('')
  const [jd, setJd] = useState('')
  const [notes, setNotes] = useState('')

  const refresh = () => {
    const all = getApplications()
    setApps(all)
    setStats(getApplicationStats())
  }

  useEffect(() => { refresh() }, [])

  const handleAdd = () => {
    if (!company.trim() || !position.trim()) return
    saveApplication({
      company: company.trim(),
      position: position.trim(),
      source: source.trim() || '手动添加',
      jd,
      status: 'saved',
      appliedAt: new Date().toISOString(),
      notes,
    })
    setCompany(''); setPosition(''); setSource(''); setJd(''); setNotes('')
    setShowForm(false)
    refresh()
  }

  const handleStatusChange = (id: string, newStatus: Application['status']) => {
    updateApplication(id, { status: newStatus })
    refresh()
  }

  const grouped = STATUSES.map(s => ({
    ...s,
    items: apps.filter(a => a.status === s.key),
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">← 返回首页</Link>
              <h1 className="text-2xl font-bold text-white mt-3">📋 申请追踪看板</h1>
              <p className="text-slate-400 mt-1 text-sm">像管销售漏斗一样管你的求职</p>
            </div>
            <button onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl transition-colors text-sm font-medium">
              + 新建投递
            </button>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="border-b border-slate-800 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-5 gap-4 text-center">
            <div><div className="text-2xl font-bold text-white">{stats.total}</div><div className="text-xs text-slate-500">总计</div></div>
            <div><div className="text-2xl font-bold text-blue-400">{stats.applied}</div><div className="text-xs text-slate-500">已投</div></div>
            <div><div className="text-2xl font-bold text-purple-400">{stats.interviews}</div><div className="text-xs text-slate-500">面试</div></div>
            <div><div className="text-2xl font-bold text-emerald-400">{stats.offers}</div><div className="text-xs text-slate-500">Offer</div></div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">{stats.conversionRate}%</div>
              <div className="text-xs text-slate-500">转化率</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="border-b border-slate-800 bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input value={company} onChange={e => setCompany(e.target.value)} placeholder="公司名称 *"
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
              <input value={position} onChange={e => setPosition(e.target.value)} placeholder="职位 *"
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
              <input value={source} onChange={e => setSource(e.target.value)} placeholder="来源（如：Boss直聘、内推）"
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
              <textarea value={jd} onChange={e => setJd(e.target.value)} placeholder="JD 摘要"
                rows={2}
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 md:col-span-2 resize-none font-mono text-sm" />
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="备注"
                rows={2}
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none text-sm" />
              <div className="flex gap-2 items-end">
                <button onClick={handleAdd} disabled={!company.trim() || !position.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-2.5 rounded-lg transition-colors">
                  添加
                </button>
                <button onClick={() => setShowForm(false)}
                  className="text-slate-400 hover:text-white px-3 py-2.5 transition-colors">
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kanban board */}
      <main className="max-w-7xl mx-auto px-6 py-6 overflow-x-auto">
        <div className="flex gap-4 min-w-[900px]" style={{ minHeight: '60vh' }}>
          {grouped.map(col => (
            <div key={col.key} className={`flex-1 border rounded-xl ${col.color} p-3`}>
              <div className="text-sm font-semibold text-slate-300 mb-3 flex items-center justify-between">
                <span>{col.label}</span>
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{col.items.length}</span>
              </div>
              <div className="space-y-2">
                {col.items.map(app => (
                  <div key={app.id} className="bg-slate-800/80 rounded-lg p-3 hover:bg-slate-700/80 transition-colors group">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{app.position}</p>
                        <p className="text-xs text-slate-400">{app.company}</p>
                      </div>
                      {app.jdMatchScore !== undefined && (
                        <span className={`text-xs font-bold ${
                          app.jdMatchScore >= 80 ? 'text-emerald-400' : app.jdMatchScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>{app.jdMatchScore}</span>
                      )}
                    </div>
                    {app.source && <p className="text-xs text-slate-600 mt-1">📎 {app.source}</p>}
                    {app.notes && <p className="text-xs text-slate-600 mt-1 line-clamp-2">{app.notes}</p>}
                    <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <select
                        value={app.status}
                        onChange={e => handleStatusChange(app.id, e.target.value as Application['status'])}
                        className="text-xs bg-slate-700 text-slate-300 rounded px-2 py-1 border-none outline-none cursor-pointer flex-1">
                        {STATUSES.map(s => (
                          <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                      </select>
                      <button onClick={() => { deleteApplication(app.id); refresh() }}
                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1">
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                {col.items.length === 0 && (
                  <div className="text-center py-6 text-slate-600 text-xs">
                    {col.key === 'saved' ? '点击上方新建' : '暂无'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
