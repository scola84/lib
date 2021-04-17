import Format from 'intl-messageformat'

export class Formatter {
  public static lang = 'nl'

  public static strings: Record<string, Record<string, string> | undefined> = {}

  public format (string: string, language = Formatter.lang, data?: Record<string, unknown>): string {
    try {
      return String(new Format(Formatter.strings[language]?.[string] ?? string, language).format(data))
    } catch (error: unknown) {
      return string
    }
  }

  public lookup (string: string, language = Formatter.lang): string | undefined {
    const strings = Formatter.strings[language] ?? {}

    return Object
      .keys(strings)
      .find((code) => {
        return strings[code].toLowerCase() === string.toLowerCase()
      })
  }
}
