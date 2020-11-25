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

  public static lookup (text: string, lang = FormatElement.lang): string | undefined {
    const strings = FormatElement.strings?.[lang] ?? {}

    return Object
      .keys(strings)
      .find((code) => {
        return strings[code].toLowerCase() === text.toLowerCase()
      })
  }

  public format (code: string, data?: Record<string, unknown>, lang = FormatElement.lang): string {
    try {
      return String(new Format(FormatElement.strings?.[lang]?.[code] ?? '', lang).format(data))
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error(error)
      return code
    }
  }

  public render (): TemplateResult {
    const code = this.code?.toLowerCase() ?? ''
    const data = this.data ?? this.dataset
    const lang = this.lang === ''
      ? undefined
      : this.lang

    return html`
      <slot name="body">
        <slot>${this.format(code, data, lang)}</slot>
      </slot>
    `
  }
}
