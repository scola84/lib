import { customElement, property } from 'lit/decorators.js'
import Format from 'intl-messageformat'
import { NodeElement } from './node'
import type { TemplateResult } from 'lit'
import { html } from 'lit'

declare global {
  interface HTMLElementTagNameMap {
    'scola-format': FormatElement
  }
}

@customElement('scola-format')
export class FormatElement extends NodeElement {
  public static lang = 'nl'

  public static strings: Record<string, Record<string, string> | undefined> = {}

  @property()
  public code?: string

  @property({
    attribute: false
  })
  public data?: Record<string, unknown>

  public format (string: string, language = FormatElement.lang, data?: Record<string, unknown>): string {
    try {
      return String(new Format(FormatElement.strings[language]?.[string] ?? string, language).format(data))
    } catch (error: unknown) {
      return string
    }
  }

  public lookup (string: string, language = FormatElement.lang): string | undefined {
    const strings = FormatElement.strings[language] ?? {}

    const foundCode = Object
      .keys(strings)
      .find((code) => {
        return strings[code].toLowerCase() === string.toLowerCase()
      })

    return foundCode
  }

  public render (): TemplateResult {
    const code = this.code?.toLowerCase() ?? ''
    const data = this.data ?? this.dataset
    const language = this.lang === '' ? undefined : this.lang

    const template = html`
      <slot name="body">
        <slot>${this.format(code, language, data)}</slot>
      </slot>
    `

    return template
  }
}
