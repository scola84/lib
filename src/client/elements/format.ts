import { customElement, property } from 'lit/decorators.js'
import Format from 'intl-messageformat'
import { NodeElement } from './node'
import type { SourceElement } from './source'
import type { TemplateResult } from 'lit'
import type { ViewElement } from './view'
import { html } from 'lit'

declare global {
  interface HTMLElementTagNameMap {
    'scola-format': FormatElement
  }
}

@customElement('scola-format')
export class FormatElement extends NodeElement {
  public static lang = 'en'

  public static strings: Partial<Record<string, Record<string, string>>> = {}

  public static updaters = {
    ...NodeElement.updaters,
    source: (source: FormatElement, target: SourceElement): void => {
      if (source.isObject(target.data)) {
        source.data = target.data
      }
    },
    view: (source: FormatElement, target: ViewElement): void => {
      source.data = {
        title: target.view?.element?.viewTitle
      }
    }
  }

  @property()
  public code?: string

  @property({
    attribute: false
  })
  public data?: Record<string, unknown>

  protected updaters = FormatElement.updaters

  public format (code: string, language = FormatElement.lang, data?: Record<string, unknown>): string {
    return String(new Format(FormatElement.strings[language]?.[code] ?? code, language).format(data))
  }

  public render (): TemplateResult {
    const code = this.code ?? ''
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
