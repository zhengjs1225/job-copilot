import Link from 'next/link'

const modules = [
  {
    title: '🔍 JD 智能匹配',
    desc: '把你的简历和岗位 JD 向量化，问"我适合这个岗位吗"',
    href: '/jd-match',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: '📊 Gap 分析',
    desc: '指出差距、给依据、评测可信度 — 技术深度核心',
    href: '/gap-analysis',
    color: 'from-purple-500 to-pink-500',
  },
  {
    title: '📝 简历 & 求职信定制',
    desc: '按 JD 自动改写简历和 Cover Letter',
    href: '/resume',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    title: '🏢 公司研究 Agent',
    desc: '输入公司名联网搜，生成画像 + 面试题',
    href: '/company',
    color: 'from-orange-500 to-red-500',
  },
  {
    title: '📋 申请追踪看板',
    desc: '把投递当 lead 跟踪漏斗、算转化率',
    href: '/tracker',
    color: 'from-indigo-500 to-violet-500',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <header className="border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Job Copilot
              </h1>
              <p className="text-slate-400 mt-1">你的 AI 求职副驾驶</p>
            </div>
            <a
              href="https://github.com/zhengjs1225/job-copilot"
              target="_blank"
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              GitHub →
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { label: '模块', value: '5' },
            { label: '目标', value: '6 周' },
            { label: '状态', value: '构建中' },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center"
            >
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Modules Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="group relative bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-600 transition-all hover:-translate-y-0.5"
            >
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${m.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <h3 className="text-lg font-semibold text-white mb-2 relative">
                {m.title}
              </h3>
              <p className="text-sm text-slate-400 relative">{m.desc}</p>
            </Link>
          ))}
        </div>

        {/* Build log */}
        <div className="mt-12 bg-slate-900/30 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            📌 项目里程碑
          </h2>
          <ul className="space-y-2 text-sm">
            <li className="text-slate-400">
              <span className="text-emerald-400">✓</span> M0 — 项目脚手架 + CI + 部署（进行中）
            </li>
            <li className="text-slate-600">
              <span className="text-slate-600">○</span> M1 — RAG 最小闭环：JD 匹配
            </li>
            <li className="text-slate-600">
              <span className="text-slate-600">○</span> M2 — Gap 分析 + 幻觉评测
            </li>
            <li className="text-slate-600">
              <span className="text-slate-600">○</span> M3 — 简历 / Cover Letter 定制
            </li>
            <li className="text-slate-600">
              <span className="text-slate-600">○</span> M4 — 公司研究 Agent
            </li>
            <li className="text-slate-600">
              <span className="text-slate-600">○</span> M5 — 申请追踪看板 + 前端整合
            </li>
            <li className="text-slate-600">
              <span className="text-slate-600">○</span> M6 — 部署 + README + 技术博客
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
