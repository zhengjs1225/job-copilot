# DevLog — 开发日志

## 2026-06-18

### M0: 项目脚手架搭建

- 创建 Next.js 15 (App Router) + TypeScript + Tailwind v4 项目
- 搭建 5 个模块页面路由：JD 匹配 / Gap 分析 / 简历定制 / 公司研究 / 申请追踪
- 配置 GitHub Actions CI（lint + build）
- 安装核心依赖：@supabase/supabase-js, ai, lucide-react, radix-ui
- 创建 PR #1: 重写 README（见 ADR-001）
- 初次构建验证通过

### 踩坑记录

- Ubuntu 源的 gh 版本 2.4 功能不全，但基础操作够用
- create-next-app npm install 首次超时（120s），重试成功
