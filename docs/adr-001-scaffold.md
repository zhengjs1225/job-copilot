# ADR-001: 项目脚手架与技术选型

## 日期

2026-06-18

## 背景

启动 Job Copilot 项目，需要确定技术栈和项目结构。

## 决策

- **前端框架**: Next.js 15 App Router（React 19）
  - 理由: 一个框架覆盖前端 + API 路由，避免额外后端服务
- **样式**: Tailwind CSS v4
  - 理由: 实用优先，开发效率高
- **数据库 / 向量**: Supabase (托管 Postgres + pgvector)
  - 理由: 一个服务搞定 DB、向量检索、认证，不用本地装任何东西
- **LLM**: DeepSeek API（已有 key）/ OpenAI API
  - 理由: 调 API 不自己训，快速迭代
- **部署**: Vercel
  - 理由: Next.js 原生支持，一条命令上线
- **CI**: GitHub Actions
  - 理由: 和 GitHub 仓库原生集成

## 影响

- 开发环境极简：只需 Node.js + 浏览器
- 不依赖 Docker，不用本地数据库
- API Key 走 .env.local，不上仓库
