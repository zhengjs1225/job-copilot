# Job Copilot 🤖 — 你的 AI 求职副驾驶

> **用工程化的方式给自己造一台找工作的机器**  
> 造的过程练成 AI 全栈本事，机器跑起来帮你拿面试，看板里的转化率又成了谈资。

---

## 背景

求职是一个多步骤的漏斗：看到 JD → 判断匹配度 → 补差距 → 定制简历 → 研究公司 → 投递 → 跟进。每一步都有重复劳动。

**Job Copilot** 把这 7 个步骤串成一个 AI 驱动的流水线，让你从"海投"变成"精准打击"。

## 5 大模块

| 模块 | 作用 | 状态 |
|------|------|------|
| 🔍 **JD 智能匹配** | 把你的简历和 JD 向量化，问"我适合这个岗位吗" | 🚧 建设中 |
| 📊 **Gap 分析 + 幻觉评测** | 指出差距、给依据、评估可信度 | 🚧 建设中 |
| 📝 **简历 & 求职信定制** | 按 JD 自动改写简历和 Cover Letter | 🚧 建设中 |
| 🏢 **公司研究 Agent** | 输入公司名联网搜，画像 + 面试题 | 🚧 建设中 |
| 📋 **申请追踪看板** | 把投递当 lead 跟踪漏斗、算转化率 | 🚧 建设中 |

## 技术栈

| 层 | 选型 | 说明 |
|----|------|------|
| 前端 | React 19 + Next.js 15 (App Router) | SSR + 静态生成 |
| 样式 | Tailwind CSS v4 | 实用优先 |
| 后端 | Next.js API Routes | 无额外后端服务 |
| 数据库 / 向量 | Supabase (Postgres + pgvector) | 托管，不自己装 DB |
| 大模型 | DeepSeek / OpenAI API | 调 API，不自己训 |
| 部署 | Vercel | 一条命令上线 |
| CI | GitHub Actions | lint + build 自动检查 |

## 一键启动

```bash
# 1. 克隆
git clone https://github.com/zhengjs1225/job-copilot.git
cd job-copilot

# 2. 装依赖
npm install

# 3. 配环境变量
cp .env.example .env.local
# 编辑 .env.local 填入 Supabase 和 LLM API Key

# 4. 启动开发服务器
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000) 即可使用。

## 项目结构

```
src/
├── app/
│   ├── page.tsx          # 首页
│   ├── layout.tsx        # 全局布局
│   ├── jd-match/         # M1: JD 智能匹配
│   ├── gap-analysis/     # M2: Gap 分析
│   ├── resume/           # M3: 简历定制
│   ├── company/          # M4: 公司研究
│   └── tracker/          # M5: 申请追踪
├── components/           # 共享组件
└── lib/                  # 工具函数
    ├── supabase.ts       # Supabase 客户端
    └── utils.ts          # Tailwind 工具
```

## 里程碑

| 里程碑 | 内容 | 预期完成 |
|--------|------|---------|
| M0 | 项目脚手架 + CI + 部署 | 第 1 周 |
| M1 | RAG 最小闭环：JD 匹配 | 第 2 周 |
| M2 | Gap 分析 + 幻觉评测 | 第 3 周 |
| M3 | 简历 / Cover Letter 定制 | 第 4 周 |
| M4 | 公司研究 Agent | 第 5 周 |
| M5 | 申请追踪看板 + 前端整合 | 第 6 周 |
| M6 | 部署上线 + README + 技术博客 | 第 6 周 |

## 设计原则

1. **用现成服务，不自建** — Supabase 替代本地 MySQL/向量库，Vercel 替代自运维服务器
2. **PR 驱动开发** — 每个功能开分支，main 永不直推
3. **CI 红了不合** — GitHub Actions 自动检查 lint + build
4. **文档即代码** — devlog.md 记每次踩坑，ADR 记关键选型

## License

MIT
