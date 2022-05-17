import { Hider, Mutator, Observer, Propagator } from '../helpers'
import { I18n, isArray, isStruct, isUser } from '../../common'
import type { Struct, User } from '../../common'
import type { ScolaElement } from './element'

declare global {
  interface HTMLElementEventMap {
    'sc-app-locale': CustomEvent
    'sc-app-theme': CustomEvent
    'sc-app-time-zone': CustomEvent
  }

  interface WindowEventMap {
    'sc-app-locale': CustomEvent
    'sc-app-theme': CustomEvent
    'sc-app-time-zone': CustomEvent
  }
}

export class ScolaAppElement extends HTMLDivElement implements ScolaElement {
  public static storage: Partial<Struct<Storage>> = {
    local: window.localStorage,
    session: window.sessionStorage
  }

  public static theme: string

  public static themes = [
    'sc-light',
    'sc-dark'
  ]

  public hider?: Hider

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public storage: Storage

  public get data (): unknown {
    return {
      ...this.dataset
    }
  }

  public set data (data: unknown) {
    if (isUser(data)) {
      this.setUser(data)
    }
  }

  public get locale (): string {
    return I18n.locale
  }

  public get theme (): string {
    return ScolaAppElement.theme
  }

  public get timeZone (): string {
    return I18n.timeZone
  }

  protected handleLocaleBound = this.handleLocale.bind(this)

  protected handleObserverBound = this.handleObserver.bind(this)

  protected handleThemeBound = this.handleTheme.bind(this)

  protected handleTimeZoneBound = this.handleTimeZone.bind(this)

  public constructor () {
    super()
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)

    if (this.hasAttribute('sc-hide')) {
      this.hider = new Hider(this)
    }

    this.reset()
  }

  public static define (): void {
    customElements.define('sc-app', ScolaAppElement, {
      extends: 'div'
    })
  }

  public connectedCallback (): void {
    this.observer.observe(this.handleObserverBound, [
      'hidden'
    ])

    this.hider?.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()
  }

  public disconnectedCallback (): void {
    this.hider?.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public notify (): void {
    this.toggleAttribute('sc-updated', true)
    this.toggleAttribute('sc-updated', false)
    this.propagator.dispatchEvents('update')

    window.dispatchEvent(new CustomEvent('sc-app-locale', {
      detail: this.locale
    }))

    window.dispatchEvent(new CustomEvent('sc-app-theme', {
      detail: this.theme
    }))

    window.dispatchEvent(new CustomEvent('sc-app-time-zone', {
      detail: this.timeZone
    }))
  }

  public reset (): void {
    this.storage = ScolaAppElement.storage[this.getAttribute('sc-storage') ?? 'session'] ?? window.sessionStorage
    this.setLocale(this.loadLocale())
    this.setTheme(this.loadTheme())
    this.setTimeZone(this.loadTimeZone())
  }

  public toJSON (): unknown {
    return {
      id: this.id,
      is: this.getAttribute('is'),
      locale: this.locale,
      nodeName: this.nodeName,
      theme: this.theme,
      timeZone: this.timeZone
    }
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-app-locale', this.handleLocaleBound)
    this.addEventListener('sc-app-theme', this.handleThemeBound)
    this.addEventListener('sc-app-time-zone', this.handleTimeZoneBound)
  }

  protected findThemeIndex (): number {
    return ScolaAppElement.themes.findIndex((theme) => {
      return document.body.classList.contains(theme)
    })
  }

  protected handleLocale (event: CustomEvent): void {
    if (
      isArray(event.detail) &&
      typeof event.detail[0] === 'string'
    ) {
      this.setLocale(event.detail[0])
    }

    this.notify()
  }

  protected handleObserver (mutations: MutationRecord[]): void {
    const attributes = this.observer.normalizeMutations(mutations)

    if (attributes.includes('hidden')) {
      this.hider?.toggle()
    }
  }

  protected handleTheme (event: CustomEvent): void {
    if (
      isStruct(event.detail) &&
      event.detail.theme !== undefined
    ) {
      this.setTheme(String(event.detail.theme))
    } else {
      this.toggleTheme()
    }

    this.notify()
  }

  protected handleTimeZone (event: CustomEvent): void {
    if (
      isArray(event.detail) &&
      typeof event.detail[0] === 'string'
    ) {
      this.setTimeZone(event.detail[0])
    }

    this.notify()
  }

  protected loadLocale (): string {
    return this.storage.getItem('sc-app-locale') ?? navigator.language
  }

  protected loadTheme (): string {
    return ScolaAppElement.themes[this.findThemeIndex()] ?? ScolaAppElement.themes[0]
  }

  protected loadTimeZone (): string {
    return this.storage.getItem('sc-app-time-zone') ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-app-locale', this.handleLocaleBound)
    this.removeEventListener('sc-app-theme', this.handleThemeBound)
    this.removeEventListener('sc-app-time-zone', this.handleTimeZoneBound)
  }

  protected setLocale (locale: string): void {
    I18n.locale = locale
    document.documentElement.lang = I18n.locale.slice(0, 2)
    this.storage.setItem('sc-app-locale', locale)
  }

  protected setTheme (theme: string): void {
    document.body.classList.remove(this.theme)
    ScolaAppElement.theme = theme
    document.body.classList.add(theme)
    this.storage.setItem('sc-app-theme', theme)
  }

  protected setTimeZone (timeZone: string): void {
    I18n.timeZone = timeZone
    this.storage.setItem('sc-app-time-zone', timeZone)
  }

  protected setUser (user: User): void {
    if (user.i18n_locale !== null) {
      this.setLocale(user.i18n_locale)
    }

    if (user.i18n_time_zone !== null) {
      this.setTimeZone(user.i18n_time_zone)
    }

    this.notify()
  }

  protected toggleTheme (): void {
    this.setTheme(ScolaAppElement.themes[this.findThemeIndex() + 1] ?? ScolaAppElement.themes[0])
  }
}
