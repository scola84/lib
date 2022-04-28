import { I18n, isError } from '../../common'
import type { ScolaElement } from '../elements'

export class Formatter {
  public data: unknown

  public element: ScolaElement

  public focus?: string

  public html?: string

  public i18n: I18n

  public locale?: string

  public text?: string

  public title?: string

  public constructor (element: ScolaElement) {
    this.element = element
    this.i18n = new I18n()
    this.reset()
  }

  public reset (): void {
    this.focus = this.element.getAttribute('sc-focus') ?? undefined
    this.html = this.element.getAttribute('sc-html') ?? undefined
    this.locale = this.element.getAttribute('sc-locale') ?? undefined
    this.text = this.element.getAttribute('sc-text') ?? undefined
    this.title = this.element.getAttribute('sc-title') ?? undefined
  }

  public setData (data: unknown): void {
    if (isError(data)) {
      this.text = data.code
      this.data = data.data
    } else {
      this.data = data
    }
  }

  public update (): void {
    if (this.text !== undefined) {
      this.element.textContent = this.format(this.text, this.data, this.locale) ?? this.element.textContent
    }

    if (this.html !== undefined) {
      this.element.innerHTML = this.marked(this.html, this.data, this.locale) ?? this.element.innerHTML
    }

    if (this.title !== undefined) {
      this.element.title = this.format(this.title, this.data, this.locale) ?? ''
    }

    if (
      this.focus === 'formatter' &&
      !this.element.hasAttribute('hidden')
    ) {
      this.element.setAttribute('tabindex', '0')
      this.element.focus()
      this.element.removeAttribute('tabindex')
      this.element.blur()
    }
  }

  protected format (code: string, data: unknown, locale?: string): string | null {
    const string = this.i18n.format(code, data, locale ?? undefined)

    if (
      string === '' ||
      string === code
    ) {
      return null
    }

    return string
  }

  protected marked (code: string, data: unknown, locale?: string): string | null {
    const string = this.i18n.marked(code, data, locale ?? undefined)

    if (
      string === '' ||
      string === code
    ) {
      return null
    }

    return string
  }
}
