import type { Struct } from '../../../common'

/**
 * Defines language-specific collections of strings once and manages them throughout the application.
 */
export class Formatter {
  public static lang = 'en'

  public static strings: Partial<Struct<Struct<string>>> = {}

  public format (code: string, language = Formatter.lang, data?: Struct): string {
    return ''
  }

  public lookup (string: string, language = Formatter.lang): string | undefined {
    return ''
  }

  public parse (string: string, language = Formatter.lang): [] {
    return []
  }
}
