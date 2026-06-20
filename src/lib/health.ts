// 求职健康分计算
import { getApplications, getApplicationStats } from './storage'

export interface HealthScore {
  overall: number          // 0-100
  funnel: number           // 投递漏斗健康度
  quality: number          // 投递质量（匹配分平均值）
  momentum: number         // 活跃度（最近投递频率）
  tips: string[]
}

export function computeHealthScore(): HealthScore {
  if (typeof window === 'undefined') {
    return { overall: 0, funnel: 0, quality: 0, momentum: 0, tips: ['请先开始投递'] }
  }

  const apps = getApplications()
  const stats = getApplicationStats()
  const tips: string[] = []

  // funnel score: conversion rate, interview rate
  const interviewRate = stats.applied > 0 ? stats.interviews / stats.applied : 0
  const funnel = Math.round(Math.min(100, (interviewRate * 150 + (stats.total > 0 ? 20 : 0))))

  // quality score: average JD match score
  const scored = apps.filter(a => a.jdMatchScore !== undefined)
  const avgScore = scored.length > 0 ? scored.reduce((s, a) => s + (a.jdMatchScore || 0), 0) / scored.length : 0
  const quality = Math.round(Math.min(100, avgScore + (scored.length > 0 ? 10 : 0)))

  // momentum: recent activity (apps in last 7 days)
  const weekAgo = Date.now() - 7 * 86400000
  const recentApps = apps.filter(a => new Date(a.updatedAt).getTime() > weekAgo).length
  const momentum = Math.round(Math.min(100, recentApps * 20))

  // overall weighted
  const overall = Math.round(Math.min(100, funnel * 0.35 + quality * 0.35 + momentum * 0.30))

  // Generate tips
  if (stats.total === 0) tips.push('🎯 还没有投递记录，先去找个 JD 试试匹配分析')
  if (interviewRate < 0.1 && stats.applied > 5) tips.push('📊 面试转化率偏低，建议优化简历和 JD 匹配度')
  if (avgScore < 60 && scored.length > 0) tips.push('📝 你的简历和目标 JD 匹配分偏低，试试定制简历功能')
  if (momentum === 0 && stats.total > 0) tips.push('⏰ 一周没投递了，保持节奏！')
  if (stats.offers > 0) tips.push('🎉 已经有 Offer 了！去看板看看还有没有更好的选择')
  if (tips.length === 0) tips.push('✅ 状态不错，继续保持！')

  return { overall, funnel, quality, momentum, tips }
}
