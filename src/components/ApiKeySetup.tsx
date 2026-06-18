'use client'

import { useState } from 'react'
import { hasApiKey, setApiKey } from '@/lib/ai'

export function ApiKeySetup({ onDone }: { onDone?: () => void }) {
  const [key, setKey] = useState('')
  const [saved, setSaved] = useState(hasApiKey())

  if (saved) return null

  const handleSave = () => {
    if (!key.trim()) return
    setApiKey(key.trim())
    setSaved(true)
    onDone?.()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-2">🔑 设置 API Key</h2>
        <p className="text-slate-400 text-sm mb-6">
          输入你的 DeepSeek API Key，只存在你浏览器本地，不会上传到任何服务器。
        </p>
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="sk-..."
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 mb-4 focus:outline-none focus:border-blue-500"
          autoFocus
        />
        <button
          onClick={handleSave}
          disabled={!key.trim()}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg px-4 py-3 transition-colors"
        >
          保存并开始
        </button>
      </div>
    </div>
  )
}
