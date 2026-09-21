import assert from 'node:assert/strict'
import test from 'node:test'
import { advanceSimulation, createInitialState, getReadings, simulationReducer, ZONES } from './simulation.ts'
import type { SimulationState, ZoneId } from './simulation.ts'

function leak(zone: ZoneId = 'B'): SimulationState {
  return simulationReducer(simulationReducer(createInitialState(), { type: 'select-zone', zone }), { type: 'trigger-leak' })
}

function run(state: SimulationState, seconds: number): SimulationState {
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.1) {
    state = advanceSimulation(state, Math.min(0.1, seconds - elapsed))
  }
  return state
}

const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`)

test('normal network conserves water, starts without an alarm, and has stable readings', () => {
  const initial = createInitialState()
  const state = run(initial, 10)
  assert.equal(state.phase, 'normal')
  assert.equal(state.detectedZone, null)
  assert.equal(state.waterLostLiters, 0)
  assert.equal(initial.elapsedSeconds, 0)
  const readings = getReadings(state)
  assert.equal(readings.efficiencyPercent, 100)
  assert.equal(readings.totalFlowLpm, 108)
})

test('detection requires three simulated seconds and identifies each damaged branch', () => {
  for (const zone of ZONES) {
    let state = leak(zone.id)
    assert.equal(state.phase, 'leaking')
    state = run(state, 2.9)
    assert.equal(state.phase, 'analyzing')
    assert.equal(state.detectedZone, null)
    state = advanceSimulation(state, 0.1)
    assert.equal(state.phase, 'detected')
    assert.equal(state.detectedZone, zone.id)
    close(state.detectedAtSeconds!, 3)
    const changedSelection = { ...state, selectedZone: zone.id === 'A' ? 'B' as const : 'A' as const }
    assert.equal(getReadings(changedSelection).zones.find((reading) => reading.leakFlowLpm > 0)?.zoneId, zone.id)
  }
})

test('mass balance and integrated water loss hold across severity and zone choices', () => {
  for (const zone of ZONES) {
    for (const severity of [10, 50, 100]) {
      const state = simulationReducer(leak(zone.id), { type: 'set-severity', severity })
      const readings = getReadings(state)
      for (const reading of readings.zones) {
        close(reading.upstreamFlowLpm, reading.downstreamFlowLpm + reading.leakFlowLpm)
        assert.ok(reading.pressureBar >= 0)
      }
      close(readings.totalFlowLpm, readings.deliveredFlowLpm + readings.leakFlowLpm)
      close(run(state, 60).waterLostLiters, readings.leakFlowLpm)
      assert.equal(run(state, 3).detectedZone, zone.id)
    }
  }
})

test('pump off stops flow and loss, resets incomplete evidence, and requires fresh evidence on restart', () => {
  let state = run(leak(), 2)
  state = simulationReducer(state, { type: 'toggle-pump' })
  const loss = state.waterLostLiters
  assert.equal(state.evidenceSeconds, 0)
  state = run(state, 10)
  assert.equal(getReadings(state).totalFlowLpm, 0)
  assert.equal(getReadings(state).pressureBar, 0)
  assert.equal(state.waterLostLiters, loss)
  assert.equal(state.detectedZone, null)
  state = simulationReducer(state, { type: 'toggle-pump' })
  assert.equal(run(state, 2.9).detectedZone, null)
  assert.equal(run(state, 3).detectedZone, 'B')
})

test('isolation closes only the detected damaged branch and preserves cumulative loss', () => {
  const active = leak('C')
  assert.equal(simulationReducer(active, { type: 'isolate' }), active)
  const isolated = simulationReducer(run(active, 3), { type: 'isolate' })
  const readings = getReadings(isolated)
  assert.equal(isolated.phase, 'isolated')
  assert.equal(readings.leakFlowLpm, 0)
  assert.equal(readings.zones.find((zone) => zone.zoneId === 'C')?.upstreamFlowLpm, 0)
  assert.equal(readings.zones.filter((zone) => zone.downstreamFlowLpm > 0).length, 2)
  assert.equal(run(isolated, 10).waterLostLiters, isolated.waterLostLiters)
  assert.equal(getReadings(simulationReducer(isolated, { type: 'toggle-pump' })).leakFlowLpm, 0)
})

test('pause freezes time, loss and evidence; double speed advances all together', () => {
  const active = run(leak(), 1)
  const paused = simulationReducer(active, { type: 'toggle-pause' })
  assert.equal(advanceSimulation(paused, 1), paused)
  const fast = simulationReducer(simulationReducer(paused, { type: 'toggle-pause' }), { type: 'set-speed', speed: 2 })
  const next = advanceSimulation(fast, 1)
  close(next.elapsedSeconds, 3)
  close(next.waterLostLiters, getReadings(next).leakFlowLpm * 3 / 60)
  assert.equal(next.phase, 'detected')
})

test('invalid timesteps are ignored and long frames are bounded without numeric contamination', () => {
  const state = leak()
  for (const dt of [NaN, Infinity, -Infinity, -1, 0]) assert.equal(advanceSimulation(state, dt), state)
  const next = advanceSimulation(state, Number.MAX_VALUE)
  assert.equal(next.elapsedSeconds, 1)
  close(next.waterLostLiters, getReadings(state).leakFlowLpm / 60)
  assert.equal(next.phase, 'analyzing')
})

test('severity is finite and bounded; more severe leaks lose more water and reduce pressure', () => {
  const state = leak()
  const low = simulationReducer(state, { type: 'set-severity', severity: -100 })
  const high = simulationReducer(state, { type: 'set-severity', severity: 999 })
  assert.equal(low.severity, 10)
  assert.equal(high.severity, 100)
  assert.equal(simulationReducer(state, { type: 'set-severity', severity: NaN }), state)
  assert.ok(getReadings(high).leakFlowLpm > getReadings(low).leakFlowLpm)
  assert.ok(getReadings(high).pressureBar < getReadings(low).pressureBar)
})

test('active incident cannot move to another selected zone; repair reopens branch; reset clears everything', () => {
  const state = run(leak('A'), 3)
  assert.equal(simulationReducer(state, { type: 'select-zone', zone: 'C' }), state)
  assert.equal(simulationReducer(state, { type: 'trigger-leak' }), state)
  const repaired = simulationReducer(simulationReducer(state, { type: 'isolate' }), { type: 'repair' })
  assert.equal(repaired.phase, 'normal')
  assert.equal(repaired.leakZone, null)
  assert.equal(repaired.waterLostLiters, state.waterLostLiters)
  assert.equal(getReadings(repaired).totalFlowLpm, 108)
  assert.deepEqual(simulationReducer(repaired, { type: 'reset' }), createInitialState())
})
