// Transient mechanical state: no cards, wallet data, snapshots or game commands.
export const FIDGET_UPDATE_MS = 50;
export const FIDGET_TIMEOUT_MS = 2000;
export function validFidget(state) {
  if (!state || !['dial', 'press', 'ball'].includes(state.kind) ||
    !['start', 'move', 'release', 'settle', 'cancel'].includes(state.phase) ||
    !Number.isFinite(state.angle) || state.angle < 0 || state.angle >= Math.PI * 2 ||
    !Number.isFinite(state.velocity) || Math.abs(state.velocity) > 22 || typeof state.pressed !== 'boolean') return false;
  if (state.phase === 'start' && !state.pressed) return false;
  if (['release','settle','cancel'].includes(state.phase) && state.pressed) return false;
  if (['settle','cancel'].includes(state.phase) && state.velocity !== 0) return false;
  return state.kind !== 'press' || state.velocity === 0 && state.angle === 0;
}
export function fidgetState(state) {
  return { kind: state.kind, phase: state.phase, angle: state.angle, velocity: state.velocity, pressed: state.pressed };
}
