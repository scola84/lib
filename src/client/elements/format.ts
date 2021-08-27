import { customElement, property } from 'lit/decorators.js'
import { format, isObject } from '../../common'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import marked from 'marked'
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
    type: Boolean
  })
  public marked?: boolean

  @property({
    attribute: false
  })
  public options: marked.MarkedOptions = {
    breaks: true,
    smartLists: true,
    smartypants: true,
    xhtml: true
  }

  @property({
    attribute: 'show-title',
    type: Boolean
  })
  public showTitle?: boolean

  protected updaters = FormatElement.updaters

  public update (properties: PropertyValues): void {
    if (
      properties.has('code') ||
      properties.has('data') ||
      properties.has('observe')
    ) {
      this.setString()
    }

    super.update(properties)
  }

  protected setString (): void {
    let data: Record<string, unknown> = this.dataset

    if (isObject(this.data)) {
      data = {
        ...data,
        ...this.data
      }
    }

    let language: string | undefined = this.lang

    if (language === '') {
      language = FormatElement.lang
    }

    const string = format(FormatElement.strings, this.code ?? '', language, data)

    if (this.showTitle === true) {
      this.title = string
    }

    if (this.marked === true) {
      this.innerHTML = marked(string, this.options)
    } else if (this.childElementCount === 0) {
      this.textContent = string
    }
  }
}
