import Format from 'intl-messageformat'

export class Formatter {
  public static lang = 'nl'

  public static strings?: Record<string, Record<string, string> | undefined>

  public static lookup (text: string, lang = Formatter.lang): string | undefined {
    const strings = Formatter.strings?.[lang] ?? {}

    return Object
      .keys(strings)
      .find((code) => {
        return strings[code].toLowerCase() === text.toLowerCase()
      })
  }

  public format (code: string, data?: Record<string, unknown>, lang = Formatter.lang): string {
    try {
      return String(new Format(Formatter.strings?.[lang]?.[code] ?? '', lang).format(data))
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error(error)
      return code
    }
  }
}
