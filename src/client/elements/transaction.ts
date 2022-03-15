import type { ScolaElement } from './element'
import type { Struct } from '../../common'
import type { Transaction } from '../helpers'

export interface ScolaTransactionElement extends ScolaElement {
  name: string

  add: (data: Struct) => Promise<Struct>

  commit: (transaction: Transaction, data: Struct) => Promise<void>

  delete: (data: Struct) => Promise<Struct>

  put: (data: Struct) => Promise<Struct>

  rollback: (transaction: Transaction) => Promise<void>
}
