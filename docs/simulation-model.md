# Irrigation simulation model

This is a deterministic educational simulation. It does not connect to real sensors, use trained AI, estimate GPS coordinates, or provide engineering-grade hydraulic predictions.

## Network and units

Three independently valved branches connect to a common pumped supply. A and C are surface branches; B is buried. Diagram coordinates are schematic world units, not geographic coordinates. Baseline irrigation demand is A: 40, B: 32, C: 36 liters/minute. Healthy pressure is 3.2 bar.

Each branch has an upstream and downstream flow reading. A simulated leak lies between these readings. For the damaged branch at severity `s` (10–100 percent):

- `leak = baseline × 0.5 × s / 100` liters/minute
- `downstream = baseline − 0.3 × leak` liters/minute
- `upstream = downstream + leak` liters/minute
- `branch pressure = 3.2 − 1.6 × s / 100` bar

Healthy branches keep their baseline flow. Common supply pressure uses the illustrative relationship `3.2 − 0.045 × total leak` bar. These coefficients are chosen for a legible demonstration, not calibrated to equipment. No noise or randomness is added. Pump off makes every flow and pressure zero. Isolating the damaged branch makes only its readings zero while the remaining branches continue irrigating.

## Detection and incident state

The detector compares measured upstream and downstream flow on every branch and picks the largest imbalance above 1 liter/minute. It does not use the selected scenario zone to choose a detected zone. Continuous imbalance for 3 simulated seconds confirms detection. The interface may show `leaking` initially, `analyzing` after 0.6 seconds, and `detected` at confirmation. Pump interruption before confirmation resets accumulated evidence. Detection remains latched until repair or reset.

Isolation is available after confirmation and closes the detected branch. Repair requires isolation, records the incident report, then clears the fault and reopens the branch while keeping elapsed time and cumulative lost water. Reset restores all defaults and clears counters and reports. Selecting another incident zone requires repairing or resetting the current incident.

## Incident reports and estimates

An incident records its starting simulation time and cumulative-loss baseline. Each flowing tick accumulates active leak duration, peak leak flow and minimum affected-branch pressure. Pump-off, pause and isolation do not inflate the average active leak rate. Isolation timestamps are latched once. Repair stores a separate immutable `lastReport`, with loss equal to the cumulative-counter difference since that incident began. All three displayed timings are relative to incident start, including any pump-off or waiting time but excluding paused time.

`estimateSavings` models additional avoided loss over a future 1/6/24-hour horizon after isolation, assuming continuous pumping at the recorded average leak rate. Avoided liters = mean L/min x horizon minutes; estimated money = liters / 1000 x SAR/m3. The default 5 SAR/m3 is explicitly hypothetical and editable, not a sourced tariff. Measured simulated loss is never presented as the hypothetical saved quantity. Inputs must be finite, cost 0..1000 and horizon >0..1440 minutes. Only the latest report is kept in application memory; reload/reset clears it.

The top alarm is initially an unlocalized flow warning, then names the detected branch. Its button focuses/tracks the affected sector and reveals the buried layer when needed. A modal report opens after repair and is available again through the bottom dock's report button. Test both engine and reporting with `npm test` (explicit paths work on Windows).

## Full-viewport interface

`Simulation.tsx` owns the full-screen shell, wall-clock dispatch loop and lightweight reading history. `SimulationPanel.tsx` provides native modal experiment/telemetry/view/empty-report panels. The map and action dock stay within `100dvh`; the outer page never scrolls, while long modal contents can scroll. All primary actions are accessible from the initial viewport. Body scroll locking belongs only to the simulation route and is restored on unmount. `FarmViewer` receives sequenced camera requests, cutaway and readout visibility preferences; the engine remains independent of view changes.

## Time and integration

`advanceSimulation(state, dt)` takes wall-clock seconds. Nonfinite, zero, and negative values are ignored. Each call accepts at most 1 second before applying the selected speed (1× or 2×), preventing sudden accumulated loss after a background-tab suspension. Pausing returns the existing state without advancing time, evidence, or loss; scenario controls can still change settings while paused.

`waterLostLiters += leakFlowLpm × simulatedSeconds / 60`. Flow and severity are constant during an individual integration step. Total volume and elapsed time are capped at JavaScript's maximum safe integer. Readings are derived from current state and are never accumulated or randomly perturbed. Detection time is recorded at the threshold crossing within a step.

## API and verification

`src/lib/simulation.ts` exports `ZONES`, `DETECTION_SECONDS`, `DETECTION_THRESHOLD_LPM`, `MAX_STEP_SECONDS`, typed state/readings/actions, `createInitialState()`, `getReadings(state)`, `advanceSimulation(state, dt)`, and `simulationReducer(state, action)`.

Focused tests in `src/lib/simulation.test.ts` cover conservation, all three localization cases, detection timing, loss integration, pump interruptions, branch isolation, pause and speed, invalid numeric input, severity bounds, repair, and reset. Run with `npx tsx --test src/lib/simulation.test.ts` once project dependencies are installed.
