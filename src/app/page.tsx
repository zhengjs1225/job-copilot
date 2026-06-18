import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
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

      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 w-full">
        {/* CTA */}
        <div className="text-center mb-16">
          <div className="text-6xl mb-6">🤖</div>
          <h2 className="text-3xl font-bold text-white mb-3">
            和 AI 对话，搞定求职
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
            贴 JD、查匹配、改简历、研究公司、跟踪投递——一个字都不用写，对话就行。
          </p>
          <Link
            href="/chat"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white text-lg font-semibold px-10 py-4 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-600/20"
          >
            💬 开始对话 →
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: '🔍', title: 'JD 匹配', desc: '把 JD 和简历扔进来，AI 给你打分、找差距' },
            { icon: '📝', title: '简历定制', desc: '按目标 JD 改写简历，自动生成 Cover Letter' },
            { icon: '🏢', title: '公司研究', desc: '输入公司名，AI 出画像 + 面试题' },
            { icon: '📊', title: 'Gap 分析', desc: '逐项评估你的差距，给出行动计划' },
            { icon: '📋', title: '申请追踪', desc: 'Kanban 看板管投递漏斗，算转化率' },
            { icon: '⚡', title: '全在对话里', desc: '以上所有功能，一句对话就搞定' },
          ].map((f, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="text-white font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-slate-500 text-xs">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="text-center text-sm text-slate-600">
          或者直接访问各模块：
          <div className="flex justify-center gap-4 mt-3 flex-wrap">
            <Link href="/jd-match" className="text-slate-400 hover:text-white transition-colors">JD匹配</Link>
            <Link href="/gap-analysis" className="text-slate-400 hover:text-white transition-colors">Gap分析</Link>
            <Link href="/resume" className="text-slate-400 hover:text-white transition-colors">简历定制</Link>
            <Link href="/company" className="text-slate-400 hover:text-white transition-colors">公司研究</Link>
            <Link href="/tracker" className="text-slate-400 hover:text-white transition-colors">申请追踪</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
