import { I18n, isArray, isStruct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-app-locale': CustomEvent
    'sc-app-theme': CustomEvent
  }

  interface WindowEventMap {
    'sc-app-locale': CustomEvent
    'sc-app-theme': CustomEvent
  }
}

export class App {
  public static storage: Storage = localStorage

  public static theme: string

  public static themes = ['sc-light', 'sc-dark']

  protected handleLocaleBound = this.handleLocale.bind(this)

  protected handleThemeBound = this.handleTheme.bind(this)

  public constructor () {
    App.theme = this.loadTheme()
    I18n.locale = this.loadLocale()
    document.documentElement.lang = I18n.locale.slice(0, 2)
  }

  public listen (): void {
    document.body.addEventListener('sc-app-locale', this.handleLocaleBound)
    document.body.addEventListener('sc-app-theme', this.handleThemeBound)
  }

  public setLocale (locale: string): void {
    I18n.locale = locale
    document.documentElement.lang = I18n.locale.slice(0, 2)
    App.storage.setItem('sc-app-locale', locale)

    window.dispatchEvent(new CustomEvent('sc-app-locale', {
      detail: I18n.locale
    }))
  }

  public setTheme (theme: string): void {
    document.body.classList.remove(App.theme)
    App.theme = theme
    document.body.classList.add(theme)
    App.storage.setItem('sc-app-theme', theme)

    window.dispatchEvent(new CustomEvent('sc-app-theme', {
      detail: App.theme
    }))
  }

  public toggleTheme (): void {
    this.setTheme(App.themes[this.findThemeIndex() + 1] ?? App.themes[0])
  }

  protected findThemeIndex (): number {
    return App.themes.findIndex((theme) => {
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
  }

  protected loadLocale (): string {
    return App.storage.getItem('sc-app-locale') ?? navigator.language
  }

  protected loadTheme (): string {
    return App.themes[this.findThemeIndex()] ?? App.themes[0]
  }
}
