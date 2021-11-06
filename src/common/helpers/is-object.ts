export function isObject (value: unknown): value is Record<string, unknown> {
  return Object(value) === value
}
