import Format from 'intl-messageformat'

export class Formatter {
  public static lang = 'nl'

  public static strings?: Record<string, Record<string, string> | undefined>

  public static format<Data = Record<string, unknown>> (string: string, data?: Data, lang?: string): string {
    return String(new Format(string, lang).format(data))
  }

  public static lookup (text: string, lang = Formatter.lang): string | undefined {
    const strings = Formatter.strings?.[lang] ?? {}

    return Object
      .keys(strings)
      .find((code) => {
        return strings[code].toLowerCase() === text.toLowerCase()
      })
  }

  public format<Data = Record<string, unknown>> (code: string, data?: Data, lang = Formatter.lang): string {
    try {
      return Formatter.format(Formatter.strings?.[lang]?.[code] ?? '', data, lang)
    } catch (error: unknown) {
      return code
    }
  }
}
