import type { RollupWarning, WarningHandler } from 'rollup'

export function onwarn (warning: RollupWarning, handler: WarningHandler): void {
  if (warning.code !== 'CIRCULAR_DEPENDENCY') {
    handler(warning)
  }
}
