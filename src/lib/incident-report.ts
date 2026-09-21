import type { ZoneId } from './simulation'

export interface IncidentMetrics {
  readonly id: number
  readonly zone: ZoneId
  readonly startedAtSeconds: number
  readonly startLossLiters: number
  readonly flowingSeconds: number
  readonly peakLeakFlowLpm: number
  readonly minimumPressureBar: number | null
  readonly isolatedAtSeconds: number | null
}

export interface IncidentReport {
  readonly id: number
  readonly zone: ZoneId
  readonly waterLostLiters: number
  readonly detectionSeconds: number
  readonly isolationSeconds: number
  readonly repairSeconds: number
  readonly flowingSeconds: number
  readonly averageLeakFlowLpm: number
  readonly peakLeakFlowLpm: number
  readonly minimumPressureBar: number | null
}

/** Illustrative counterfactual: continued pumping at this incident's average leak rate. */
export function estimateSavings(report: IncidentReport, pricePerCubicMeter: number, horizonMinutes: number) {
  if (!Number.isFinite(pricePerCubicMeter) || pricePerCubicMeter < 0 || pricePerCubicMeter > 1000 ||
      !Number.isFinite(horizonMinutes) || horizonMinutes <= 0 || horizonMinutes > 1440) return null
  const avoidedLiters = report.averageLeakFlowLpm * horizonMinutes
  return {
    avoidedLiters,
    estimatedSavingsSar: avoidedLiters / 1000 * pricePerCubicMeter,
    estimatedLossCostSar: report.waterLostLiters / 1000 * pricePerCubicMeter,
  }
}
