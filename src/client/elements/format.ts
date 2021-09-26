import type { Query, Strings, Struct } from '../../common'
import { customElement, property } from 'lit/decorators.js'
import { elements, format, isStruct, lookup, parse } from '../../common'
import type { Config } from 'dompurify'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import marked from 'marked'
import { sanitize } from 'dompurify'
import updaters from '../updaters/format'

declare global {
  interface HTMLElementTagNameMap {
    'scola-format': FormatElement
  }
}

@customElement('scola-format')
export class FormatElement extends NodeElement {
  public static dompurifyOptions: Config = {
    ADD_TAGS: elements
  }

  public static lang = 'en'

  public static markedOptions: marked.MarkedOptions = {
    breaks: true,
    smartLists: true,
    smartypants: true,
    xhtml: true
  }

  public static strings: Strings = {}

  public static updaters = {
    ...NodeElement.updaters,
    ...updaters
  }

  @property()
  public code?: string

  @property({
    attribute: 'hide-empty',
    type: Boolean
  })
  public hideEmpty?: boolean

  @property({
    type: Boolean
  })
  public marked?: boolean

  @property({
    attribute: 'show-title',
    type: Boolean
  })
  public showTitle?: boolean

  protected updaters = FormatElement.updaters

  public static lookup (string: string, language = FormatElement.lang): string | undefined {
    return lookup(FormatElement.strings, string, language)
  }

  public static parse (string: string, language = FormatElement.lang): Query[] {
    return parse(FormatElement.strings, string, language)
  }

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
    let data: Struct = this.dataset

    if (isStruct(this.data)) {
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

    if (string === '') {
      if (this.hideEmpty === true) {
        this.hidden = true
      }

      return
    }

    if (this.showTitle === true) {
      this.title = string
    }

    if (this.marked === true) {
      const html = sanitize(marked(string, FormatElement.markedOptions), FormatElement.dompurifyOptions)

      if (typeof html === 'string') {
        this.innerHTML = html
      }
    } else if (this.childElementCount === 0) {
      this.textContent = string
    }

    this.hidden = false
  }
}
