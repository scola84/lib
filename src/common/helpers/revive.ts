import { ScolaError, isError } from './is-error'
import { ScolaFile, isFile } from './is-file'
import { cast } from './cast'
import { isPrimitive } from './is-primitive'

export function revive (key: unknown, value: unknown): unknown {
  if (isPrimitive(value)) {
    return cast(value)
  } else if (isError(value)) {
    return new ScolaError(value)
  } else if (isFile(value)) {
    return new ScolaFile(value)
  }

  return value
}
