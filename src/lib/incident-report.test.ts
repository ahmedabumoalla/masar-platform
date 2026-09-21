import assert from 'node:assert/strict'
import test from 'node:test'
import { createInitialState, simulationReducer, type SimulationState } from './simulation.ts'
import { estimateSavings } from './incident-report.ts'

function run(state: SimulationState, seconds: number) {
  for (let i = 0; i < seconds; i++) state = simulationReducer(state, { type: 'tick', dt: 1 })
  return state
}
const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`)
function completed() {
  let state = simulationReducer(run(createInitialState(), 12), { type: 'trigger-leak' })
  state = simulationReducer(run(state, 10), { type: 'isolate' })
  return simulationReducer(run(state, 5), { type: 'repair' })
}

test('repair captures one immutable incident with relative timestamps and measured water loss', () => {
  const state = completed(), report = state.lastReport!
  assert.equal(report.zone, 'B')
  close(report.waterLostLiters, 1.6)
  close(report.detectionSeconds, 3)
  close(report.isolationSeconds, 10)
  close(report.repairSeconds, 15)
  close(report.averageLeakFlowLpm, 9.6)
  close(report.peakLeakFlowLpm, 9.6)
  close(report.minimumPressureBar!, 2.24)
  assert.equal(state.incident, null)
  assert.equal(run(state, 60).lastReport, report)
  assert.equal(simulationReducer(state, { type: 'repair' }), state)
})

test('reports exclude earlier incidents while the network counter stays cumulative', () => {
  let state = completed()
  const previous = state.lastReport!
  state = simulationReducer(state, { type: 'select-zone', zone: 'C' })
  state = simulationReducer(state, { type: 'trigger-leak' })
  state = simulationReducer(run(state, 5), { type: 'isolate' })
  state = simulationReducer(state, { type: 'repair' })
  assert.equal(state.lastReport!.id, 2)
  assert.equal(state.lastReport!.zone, 'C')
  close(state.lastReport!.waterLostLiters, 0.9)
  close(state.waterLostLiters, 2.5)
  close(previous.waterLostLiters, 1.6)
  assert.equal(simulationReducer(state, { type: 'reset' }).lastReport, null)
})

test('average leak excludes pump-off, paused and isolated time and handles changing severity', () => {
  let state = simulationReducer(createInitialState(), { type: 'select-zone', zone: 'A' })
  state = simulationReducer(state, { type: 'set-severity', severity: 20 })
  state = simulationReducer(state, { type: 'trigger-leak' })
  state = run(state, 10)
  state = simulationReducer(state, { type: 'toggle-pause' })
  state = run(state, 10)
  state = simulationReducer(state, { type: 'toggle-pause' })
  state = simulationReducer(state, { type: 'set-severity', severity: 80 })
  state = run(state, 5)
  state = simulationReducer(state, { type: 'toggle-pump' })
  state = simulationReducer(run(state, 20), { type: 'isolate' })
  state = simulationReducer(run(state, 10), { type: 'repair' })
  const report = state.lastReport!
  close(report.waterLostLiters, 2)
  close(report.flowingSeconds, 15)
  close(report.averageLeakFlowLpm, 8)
  close(report.peakLeakFlowLpm, 16)
  close(report.minimumPressureBar!, 1.92)
  close(report.isolationSeconds, 35)
  close(report.repairSeconds, 45)
})

test('savings convert liters to cubic meters and label an additional hypothetical horizon', () => {
  const report = completed().lastReport!
  const estimate = estimateSavings(report, 5, 60)!
  close(estimate.avoidedLiters, 576)
  close(estimate.estimatedSavingsSar, 2.88)
  close(estimate.estimatedLossCostSar, 0.008)
  close(estimateSavings(report, 10, 360)!.estimatedSavingsSar, 34.56)
  close(estimateSavings(report, 0, 60)!.estimatedSavingsSar, 0)
  for (const price of [NaN, Infinity, -1, 1001]) assert.equal(estimateSavings(report, price, 60), null)
  for (const horizon of [NaN, Infinity, 0, -1, 1441]) assert.equal(estimateSavings(report, 5, horizon), null)
})

test('report requires isolation and double-speed timestamps use simulation time', () => {
  let state = simulationReducer(createInitialState(), { type: 'trigger-leak' })
  assert.equal(simulationReducer(state, { type: 'repair' }), state)
  state = simulationReducer(state, { type: 'set-speed', speed: 2 })
  state = run(state, 2)
  assert.equal(simulationReducer(state, { type: 'repair' }), state)
  state = simulationReducer(state, { type: 'isolate' })
  const report = simulationReducer(state, { type: 'repair' }).lastReport!
  close(report.detectionSeconds, 3)
  close(report.isolationSeconds, 4)
  close(report.waterLostLiters, 0.64)
})
