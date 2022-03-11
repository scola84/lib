import { isStruct } from './is-struct'

export interface File {
  id: string
  name: string
  size: number
  type: string
}

export function isFile (value: unknown): value is File {
  return (
    isStruct(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    Number.isFinite(value.size) &&
    typeof value.type === 'string'
  )
}
