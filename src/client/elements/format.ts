import { customElement, property } from 'lit/decorators.js'
import { format, isObject } from '../../common'
import { NodeElement } from './node'
import type { TemplateResult } from 'lit'
import { html } from 'lit'
import updaters from '../updaters/format'

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
    ...updaters
  }

  @property()
  public code?: string

  @property({
    attribute: 'show-title',
    type: Boolean
  })
  public showTitle?: boolean

  protected updaters = FormatElement.updaters

  public render (): TemplateResult {
    let data: Record<string, unknown> = this.dataset

    if (isObject(this.data)) {
      ({ data } = this)
    }

    let language: string | undefined = this.lang

    if (language === '') {
      language = FormatElement.lang
    }

    const string = format(FormatElement.strings, this.code ?? '', language, data)

    if (this.showTitle === true) {
      this.title = string
    }

    const template = html`
      <slot name="body">
        <slot>${string}</slot>
      </slot>
    `

    return template
  }
}
