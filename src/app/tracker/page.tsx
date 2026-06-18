import Link from 'next/link'

export default function 申请追踪看板Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← 返回首页
          </Link>
          <h1 className="text-2xl font-bold text-white mt-3">申请追踪看板</h1>
          <p className="text-slate-400 mt-1 text-sm">此模块正在建设中，敬请期待 🚧</p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">🚧</div>
          <p className="text-slate-400">
            这个模块是求职 Copilot 的组成部分之一，将在后续里程碑中实现。
          </p>
        </div>
      </main>
    </div>
  )
}
