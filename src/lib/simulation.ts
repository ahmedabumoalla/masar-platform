import type { IncidentMetrics, IncidentReport } from './incident-report'

export type ZoneId = 'A' | 'B' | 'C'
export type SimulationPhase = 'normal' | 'leaking' | 'analyzing' | 'detected' | 'isolated'

export const ZONES = [
  { id: 'A', name: 'القطاع A', kind: 'surface', x: -5, z: -3, baselineFlowLpm: 40 },
  { id: 'B', name: 'القطاع B', kind: 'buried', x: 4, z: -3, baselineFlowLpm: 32 },
  { id: 'C', name: 'القطاع C', kind: 'surface', x: 4, z: 4, baselineFlowLpm: 36 },
] as const

export const DETECTION_SECONDS = 3
export const DETECTION_THRESHOLD_LPM = 1
export const MAX_STEP_SECONDS = 1

export interface SimulationState {
  readonly phase: SimulationPhase
  readonly selectedZone: ZoneId
  readonly leakZone: ZoneId | null
  readonly detectedZone: ZoneId | null
  /** Percentage of the modeled maximum opening, between 10 and 100. */
  readonly severity: number
  readonly pumpOn: boolean
  readonly paused: boolean
  readonly speed: 1 | 2
  readonly elapsedSeconds: number
  readonly evidenceSeconds: number
  readonly waterLostLiters: number
  readonly detectedAtSeconds: number | null
  readonly incident: IncidentMetrics | null
  readonly lastReport: IncidentReport | null
}

export interface ZoneReading {
  readonly zoneId: ZoneId
  readonly upstreamFlowLpm: number
  readonly downstreamFlowLpm: number
  readonly leakFlowLpm: number
  readonly pressureBar: number
  readonly isolated: boolean
}

export interface SimulationReadings {
  readonly zones: readonly ZoneReading[]
  readonly totalFlowLpm: number
  readonly deliveredFlowLpm: number
  readonly leakFlowLpm: number
  readonly pressureBar: number
  readonly efficiencyPercent: number
}

export type SimulationAction =
  | { type: 'tick'; dt: number }
  | { type: 'select-zone'; zone: ZoneId }
  | { type: 'trigger-leak' }
  | { type: 'set-severity'; severity: number }
  | { type: 'toggle-pump' }
  | { type: 'toggle-pause' }
  | { type: 'set-speed'; speed: 1 | 2 }
  | { type: 'isolate' }
  | { type: 'repair' }
  | { type: 'reset' }

export function createInitialState(): SimulationState {
  return {
    phase: 'normal', selectedZone: 'B', leakZone: null, detectedZone: null,
    severity: 60, pumpOn: true, paused: false, speed: 1,
    elapsedSeconds: 0, evidenceSeconds: 0, waterLostLiters: 0, detectedAtSeconds: null,
    incident: null, lastReport: null,
  }
}

/** Deterministic teaching model, not a hydraulic solver or live sensor feed. */
export function getReadings(state: SimulationState): SimulationReadings {
  const zones: ZoneReading[] = ZONES.map((zone) => {
    const damaged = state.leakZone === zone.id
    const isolated = state.phase === 'isolated' && state.detectedZone === zone.id
    const active = state.pumpOn && !isolated
    const leakFlowLpm = active && damaged ? zone.baselineFlowLpm * 0.5 * state.severity / 100 : 0
    const downstreamFlowLpm = active ? zone.baselineFlowLpm - leakFlowLpm * 0.3 : 0
    return {
      zoneId: zone.id,
      upstreamFlowLpm: downstreamFlowLpm + leakFlowLpm,
      downstreamFlowLpm,
      leakFlowLpm,
      pressureBar: active ? 3.2 - (damaged ? 1.6 * state.severity / 100 : 0) : 0,
      isolated,
    }
  })
  const totalFlowLpm = zones.reduce((sum, zone) => sum + zone.upstreamFlowLpm, 0)
  const deliveredFlowLpm = zones.reduce((sum, zone) => sum + zone.downstreamFlowLpm, 0)
  const leakFlowLpm = zones.reduce((sum, zone) => sum + zone.leakFlowLpm, 0)
  return {
    zones, totalFlowLpm, deliveredFlowLpm, leakFlowLpm,
    pressureBar: state.pumpOn ? 3.2 - leakFlowLpm * 0.045 : 0,
    efficiencyPercent: totalFlowLpm > 0 ? deliveredFlowLpm / totalFlowLpm * 100 : 0,
  }
}

/** Accepts wall-clock seconds. Long/background frames are capped before speed is applied. */
export function advanceSimulation(state: SimulationState, dt: number): SimulationState {
  if (state.paused || !Number.isFinite(dt) || dt <= 0) return state
  const seconds = Math.min(dt, MAX_STEP_SECONDS) * state.speed
  const readings = getReadings(state)
  // Localization uses the largest measured inlet/outlet imbalance, not the scenario selection.
  const candidate = readings.zones.reduce<ZoneReading | null>((best, zone) => {
    const imbalance = zone.upstreamFlowLpm - zone.downstreamFlowLpm
    return imbalance > DETECTION_THRESHOLD_LPM &&
      (!best || imbalance > best.upstreamFlowLpm - best.downstreamFlowLpm) ? zone : best
  }, null)
  const latched = state.phase === 'detected' || state.phase === 'isolated'
  const evidenceSeconds = latched ? state.evidenceSeconds : candidate ?
    Math.min(DETECTION_SECONDS, state.evidenceSeconds + seconds) : 0
  const detected = !latched && candidate !== null && evidenceSeconds >= DETECTION_SECONDS - 1e-9
  const phase: SimulationPhase = latched ? state.phase : detected ? 'detected' :
    !state.leakZone ? 'normal' : evidenceSeconds >= 0.6 ? 'analyzing' : 'leaking'
  const leakingReading = readings.zones.find(zone => zone.leakFlowLpm > 0)
  return {
    ...state,
    phase,
    elapsedSeconds: Math.min(Number.MAX_SAFE_INTEGER, state.elapsedSeconds + seconds),
    waterLostLiters: Math.min(Number.MAX_SAFE_INTEGER, state.waterLostLiters + readings.leakFlowLpm * seconds / 60),
    evidenceSeconds: detected ? DETECTION_SECONDS : evidenceSeconds,
    detectedZone: detected ? candidate.zoneId : state.detectedZone,
    detectedAtSeconds: detected ? state.elapsedSeconds + DETECTION_SECONDS - state.evidenceSeconds : state.detectedAtSeconds,
    incident: state.incident && leakingReading ? {
      ...state.incident,
      flowingSeconds: state.incident.flowingSeconds + seconds,
      peakLeakFlowLpm: Math.max(state.incident.peakLeakFlowLpm, leakingReading.leakFlowLpm),
      minimumPressureBar: Math.min(state.incident.minimumPressureBar ?? Infinity, leakingReading.pressureBar),
    } : state.incident,
  }
}

export function simulationReducer(state: SimulationState, action: SimulationAction): SimulationState {
  switch (action.type) {
    case 'tick': return advanceSimulation(state, action.dt)
    case 'select-zone':
      return state.leakZone || !ZONES.some((zone) => zone.id === action.zone) ? state : { ...state, selectedZone: action.zone }
    case 'trigger-leak':
      return state.leakZone ? state : {
        ...state, phase: 'leaking', leakZone: state.selectedZone,
        detectedZone: null, detectedAtSeconds: null, evidenceSeconds: 0,
        incident: { id: (state.lastReport?.id ?? 0) + 1, zone: state.selectedZone,
          startedAtSeconds: state.elapsedSeconds, startLossLiters: state.waterLostLiters,
          flowingSeconds: 0, peakLeakFlowLpm: 0, minimumPressureBar: null, isolatedAtSeconds: null },
      }
    case 'set-severity':
      return Number.isFinite(action.severity) ? { ...state, severity: Math.min(100, Math.max(10, action.severity)) } : state
    case 'toggle-pump':
      return {
        ...state, pumpOn: !state.pumpOn,
        ...(state.phase === 'analyzing' || state.phase === 'leaking' ? { phase: 'leaking' as const, evidenceSeconds: 0 } : {}),
      }
    case 'toggle-pause': return { ...state, paused: !state.paused }
    case 'set-speed': return action.speed === 1 || action.speed === 2 ? { ...state, speed: action.speed } : state
    case 'isolate': return state.phase === 'detected' && state.incident ? {
      ...state, phase: 'isolated', incident: { ...state.incident, isolatedAtSeconds: state.elapsedSeconds },
    } : state
    case 'repair': {
      const incident = state.incident
      if (state.phase !== 'isolated' || !incident || incident.isolatedAtSeconds === null || state.detectedAtSeconds === null) return state
      const lost = Math.max(0, state.waterLostLiters - incident.startLossLiters)
      return {
        ...state, phase: 'normal', leakZone: null, detectedZone: null,
        evidenceSeconds: 0, detectedAtSeconds: null,
        incident: null,
        lastReport: {
          id: incident.id, zone: incident.zone, waterLostLiters: lost,
          detectionSeconds: Math.max(0, state.detectedAtSeconds - incident.startedAtSeconds),
          isolationSeconds: Math.max(0, incident.isolatedAtSeconds - incident.startedAtSeconds),
          repairSeconds: Math.max(0, state.elapsedSeconds - incident.startedAtSeconds),
          flowingSeconds: incident.flowingSeconds,
          averageLeakFlowLpm: incident.flowingSeconds > 0 ? lost * 60 / incident.flowingSeconds : 0,
          peakLeakFlowLpm: incident.peakLeakFlowLpm, minimumPressureBar: incident.minimumPressureBar,
        },
      }
    }
    case 'reset': return createInitialState()
  }
}
