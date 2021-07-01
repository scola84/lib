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
  public static lang = 'en'

  public static strings: Record<string, Record<string, string> | undefined> = {}

  @property()
  public code?: string

  @property({
    attribute: false
  })
  public data?: Record<string, unknown>

  public format (string: string, language = FormatElement.lang, data?: Record<string, unknown>): string {
    return String(new Format(FormatElement.strings[language]?.[string] ?? string, language).format(data))
  }

  public render (): TemplateResult {
    const code = this.code?.toLowerCase() ?? ''
    const data = this.data ?? this.dataset

    let language: string | undefined = this.lang

    if (language === '') {
      language = undefined
    }

    const template = html`
      <slot name="body">
        <slot>${this.format(code, language, data)}</slot>
      </slot>
    `

    return template
  }
}
