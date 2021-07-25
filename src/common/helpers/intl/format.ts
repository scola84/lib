import Format from 'intl-messageformat'

export function format (strings: Partial<Record<string, Record<string, string>>>, code: string, language: string, data?: Record<string, unknown>): string {
  return String(new Format(strings[language]?.[code] ?? code, language).format(data))
}
