export function format (formatValue: (value: unknown) => string) {
  return (rawQuery: string, rawValues: Record<string, unknown> = {}): string => {
    const matches = rawQuery.match(/\$\(\w+\)/gu) ?? []

    let key = null
    let query = rawQuery
    let value = null

    for (const match of matches) {
      key = match.slice(2, -1)
      value = rawValues[key]

      if (value === undefined) {
        throw new Error(`Parameter "${key}" is undefined`)
      }

      query = query.replace(match, formatValue(value))
    }

    return query
  }
}
