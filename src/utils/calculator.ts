/**
 * 训练数据计算工具函数
 */

import type { ActionRecord } from '@/types/training'

export interface BestSetSummary {
  weight: number
  reps: number
  estimated1RM: number
}

/**
 * 计算单个动作的训练量
 * 公式：训练量 = 重量 × 次数 × 组数
 * 
 * @param weight 重量（kg）
 * @param reps 次数
 * @param sets 组数
 * @returns 训练量
 */
export function calculateVolume(weight: number, reps: number, sets: number): number {
  return weight * reps * sets
}

/**
 * 计算动作的训练量（从 ActionRecord）
 * 
 * @param action 动作记录
 * @returns 训练量
 */
export function calculateActionVolume(action: ActionRecord): number {
  if (action.setsDetail?.length) {
    return action.setsDetail.reduce((sum, set) => sum + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0)
  }
  return calculateVolume(action.weight, action.reps, action.sets)
}

/**
 * 估算 1RM（一次最大重复重量）
 * 公式：1RM ≈ 重量 × (1 + 0.0333 × 次数)
 * 
 * @param weight 重量（kg）
 * @param reps 次数
 * @returns 估算的 1RM
 */
export function calculate1RM(weight: number, reps: number): number {
  return weight * (1 + 0.0333 * reps)
}

/**
 * 计算动作的估算 1RM（从 ActionRecord）
 * 
 * @param action 动作记录
 * @returns 估算的 1RM
 */
export function calculateAction1RM(action: ActionRecord): number {
  return calculateBestSet(action).estimated1RM
}

export function calculateBestSet(action: ActionRecord): BestSetSummary {
  const sets = action.setsDetail?.length
    ? action.setsDetail
    : Array.from({ length: Number(action.sets) || 0 }).map(() => ({ weight: action.weight, reps: action.reps }))
  const best = sets.reduce(
    (current, set) => (Number(set.weight) > current.weight ? { weight: Number(set.weight) || 0, reps: Number(set.reps) || 0 } : current),
    { weight: 0, reps: 0 }
  )

  return {
    ...best,
    estimated1RM: calculate1RM(best.weight, best.reps)
  }
}

/**
 * 计算训练记录的总训练量
 * 
 * @param actions 动作列表
 * @returns 总训练量
 */
export function calculateTotalVolume(actions: ActionRecord[]): number {
  return actions.reduce((total, action) => {
    return total + calculateActionVolume(action)
  }, 0)
}

/**
 * 更新动作记录的计算字段（volume 和 estimated1RM）
 * 
 * @param action 动作记录
 * @returns 更新后的动作记录（新对象）
 */
export function updateActionCalculations(action: ActionRecord): ActionRecord {
  const best = calculateBestSet(action)
  return {
    ...action,
    weight: best.weight,
    reps: best.reps,
    volume: calculateActionVolume(action),
    estimated1RM: best.estimated1RM
  }
}

/**
 * 更新训练记录的计算字段
 * 
 * @param record 训练记录
 * @returns 更新后的训练记录（新对象）
 */
export function updateRecordCalculations(record: ActionRecord[]): ActionRecord[] {
  return record.map(action => updateActionCalculations(action))
}

/**
 * 根据重量和次数计算目标重量
 * 用于根据目标 1RM 反推训练重量
 * 
 * @param target1RM 目标 1RM
 * @param reps 次数
 * @returns 建议重量
 */
export function calculateTargetWeight(target1RM: number, reps: number): number {
  if (reps === 0) return 0
  return target1RM / (1 + 0.0333 * reps)
}

/**
 * 计算两个 1RM 之间的增长量
 * 
 * @param old1RM 旧 1RM
 * @param new1RM 新 1RM
 * @returns 增长量
 */
export function calculate1RMProgress(old1RM: number, new1RM: number): number {
  return new1RM - old1RM
}

/**
 * 计算 1RM 增长率（百分比）
 * 
 * @param old1RM 旧 1RM
 * @param new1RM 新 1RM
 * @returns 增长率（0-100）
 */
export function calculate1RMGrowthRate(old1RM: number, new1RM: number): number {
  if (old1RM === 0) return 0
  return ((new1RM - old1RM) / old1RM) * 100
}
