import { cast } from './cast'
import { isPrimitive } from './is-primitive'

export function revive (key: unknown, value: unknown): unknown {
  if (isPrimitive(value)) {
    return cast(value)
  }

  return value
}
