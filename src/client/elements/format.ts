import {
  customElement,
  html,
  property
} from 'lit-element'

import Format from 'intl-messageformat'
import { NodeElement } from './node'
import type { TemplateResult } from 'lit-element'

declare global {
  interface HTMLElementTagNameMap {
    'scola-format': FormatElement
  }
}

@customElement('scola-format')
export class FormatElement extends NodeElement {
  public static lang = 'nl'

  public static strings?: Record<string, Record<string, string> | undefined>

  @property()
  public code?: string

  @property({
    attribute: false
  })
  public data?: Record<string, unknown>

  public static format<Data = Record<string, unknown>> (
    string: string,
    data?: Data,
    lang?: string
  ): string {
    return String(new Format(string, lang).format(data))
  }

  public static lookup (text: string, lang = FormatElement.lang): string | undefined {
    const strings = FormatElement.strings?.[lang] ?? {}

    return Object
      .keys(strings)
      .find((code) => {
        return strings[code].toLowerCase() === text.toLowerCase()
      })
  }

  public format<Data = Record<string, unknown>> (
    code: string,
    data?: Data,
    lang = FormatElement.lang
  ): string {
    try {
      return FormatElement.format(FormatElement.strings?.[lang]?.[code] ?? '', data, lang)
    } catch (error: unknown) {
      return code
    }
  }

  public render (): TemplateResult {
    const code = this.code?.toLowerCase() ?? ''
    const data = this.data ?? this.dataset
    const lang = this.lang === '' ? undefined : this.lang

    return html`
      <slot name="body">
        <slot>${this.format(code, data, lang)}</slot>
      </slot>
    `
  }
}
