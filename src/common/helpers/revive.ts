import { ScolaError, isError } from './is-error'
import { ScolaFile, isFile } from './is-file'
import { Transaction, isTransaction } from './is-transaction'
import { cast } from './cast'
import { isPrimitive } from './is-primitive'

export function revive (key: unknown, value: unknown): unknown {
  if (isPrimitive(value)) {
    return cast(value)
  } else if (isError(value)) {
    return new ScolaError(value)
  } else if (isFile(value)) {
    return new ScolaFile(value)
  } else if (isTransaction(value)) {
    return new Transaction(value)
  }

  return value
}
