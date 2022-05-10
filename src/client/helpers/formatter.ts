import { I18n, isError, isResult } from '../../common'
import type { ScolaElement } from '../elements'

export class Formatter {
  public ariaLabel?: string

  public data: unknown

  public element: ScolaElement

  public focus?: string

  public html?: string

  public i18n: I18n

  public locale?: string

  public text?: string

  public timeZone?: string

  public title?: string

  protected handleLocaleBound = this.handleLocale.bind(this)

  protected handleTimeZoneBound = this.handleTimeZone.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
    this.i18n = new I18n()
    this.reset()
  }

  public connect (): void {
    if ((
      !this.element.hasAttribute('sc-nolisten')
    ) && (
      this.ariaLabel !== undefined ||
      this.html !== undefined ||
      this.text !== undefined ||
      this.title !== undefined
    )) {
      this.addEventListeners()
      this.focusElement()
    }
  }

  public disconnect (): void {
    if ((
      !this.element.hasAttribute('sc-nolisten')
    ) && (
      this.ariaLabel !== undefined ||
      this.html !== undefined ||
      this.text !== undefined ||
      this.title !== undefined
    )) {
      this.removeEventListeners()
    }
  }

  public reset (): void {
    this.ariaLabel = this.element.getAttribute('sc-aria-label') ?? undefined
    this.focus = this.element.getAttribute('sc-focus') ?? undefined
    this.html = this.element.getAttribute('sc-html') ?? undefined
    this.locale = this.element.getAttribute('sc-locale') ?? undefined
    this.text = this.element.getAttribute('sc-text') ?? undefined
    this.timeZone = this.element.getAttribute('sc-time-zone') ?? undefined
    this.title = this.element.getAttribute('sc-title') ?? undefined
  }

  public setData (data: unknown): void {
    if (
      isError(data) ||
      isResult(data)
    ) {
      this.data = data.data
      this.text = data.code
    } else {
      this.data = data
    }
  }

  public update (): void {
    this.format()
    this.focusElement()
  }

  protected addEventListeners (): void {
    window.addEventListener('sc-app-locale', this.handleLocaleBound)
    window.addEventListener('sc-app-time-zone', this.handleTimeZoneBound)
  }

  protected focusElement (): void {
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

  protected format (): void {
    if (this.text !== undefined) {
      this.element.textContent = this.i18n.formatText(this.text, this.data, this.locale)
    }

    if (this.html !== undefined) {
      this.element.innerHTML = this.i18n.formatMarked(this.html, this.data, this.locale)
    }

    if (this.ariaLabel !== undefined) {
      this.element.ariaLabel = this.i18n.formatText(this.ariaLabel, this.data, this.locale)
    }

    if (this.title !== undefined) {
      this.element.title = this.i18n.formatText(this.title, this.data, this.locale)
    }
  }

  protected handleLocale (): void {
    this.format()
  }

  protected handleTimeZone (): void {
    this.format()
  }

  protected removeEventListeners (): void {
    window.removeEventListener('sc-app-locale', this.handleLocaleBound)
    window.removeEventListener('sc-app-time-zone', this.handleTimeZoneBound)
  }
}
