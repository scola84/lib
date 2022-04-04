import type { Struct } from './is-struct'
import { isNumber } from './is-number'
import { isObject } from './is-object'

export interface ScolaFileProperties extends Struct {
  id: string
  name: string
  size: number
  type: string
}

export class ScolaFile {
  public id: string

  public name: string

  public size: number

  public type: string

  public constructor (properties: ScolaFileProperties) {
    this.id = properties.id
    this.name = properties.name
    this.size = properties.size
    this.type = properties.type
  }
}

export function isFile (value: unknown): value is ScolaFileProperties {
  return (
    isObject(value)
  ) && (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    isNumber(value.size) &&
    typeof value.type === 'string'
  )
}
