import Format from 'intl-messageformat'

export class Formatter {
  public static lang = 'nl'

  public static strings: Record<string, Record<string, string> | undefined> = {}

  public static format (string: string, data?: Record<string, unknown>, lang?: string): string {
    return String(new Format(string, lang).format(data))
  }

  public static lookup (text: string, lang = Formatter.lang): string | undefined {
    const strings = Formatter.strings[lang] ?? {}

    return Object
      .keys(strings)
      .find((code) => {
        return strings[code].toLowerCase() === text.toLowerCase()
      })
  }

  public format (code: string, data: Record<string, unknown> | null = null, lang = Formatter.lang): string {
    try {
      return Formatter.format(Formatter.strings[lang]?.[code] ?? code, data ?? {}, lang)
    } catch (error: unknown) {
      return code
    }
  }
}
