import { isObject } from './is-object'

export interface TransactionProperties {
  commit: unknown
  result?: unknown
  rollback?: unknown
  type: string
}

export class Transaction {
  public commit: unknown

  public result?: unknown

  public rollback?: unknown

  public type: string

  public constructor (properties: TransactionProperties) {
    this.commit = properties.commit
    this.result = properties.result
    this.rollback = properties.rollback
    this.type = properties.type
  }
}

export function isTransaction (value: unknown): value is TransactionProperties {
  return (
    isObject(value)
  ) && (
    value.commit !== undefined &&
    typeof value.type === 'string'
  )
}
