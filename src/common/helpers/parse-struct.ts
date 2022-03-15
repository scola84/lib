import { isStruct } from './is-struct'

export function parseStruct (struct: unknown): unknown {
  if (typeof struct === 'string') {
    try {
      return JSON.parse(struct.replace(/\\"/gu, '"'))
    } catch (error: unknown) {
      return {}
    }
  } else if (isStruct(struct)) {
    return struct
  }

  return struct
}
