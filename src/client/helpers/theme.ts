import { isStruct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-theme': CustomEvent
  }

  interface WindowEventMap {
    'sc-theme': CustomEvent
  }
}

export class Theme {
  public static storage: Storage = localStorage

  public static theme: string

  public static themes = ['sc-light', 'sc-dark']

  protected handleThemeBound = this.handleTheme.bind(this)

  public constructor () {
    Theme.theme = Theme.themes[this.findThemeIndex()] ?? Theme.themes[0]
  }

  public listen (): void {
    document.body.addEventListener('sc-theme', this.handleThemeBound)
  }

  public set (theme: string): void {
    document.body.classList.remove(Theme.theme)
    Theme.theme = theme
    document.body.classList.add(theme)
    Theme.storage.setItem('sc-theme', theme)
    window.dispatchEvent(new CustomEvent('sc-theme', { detail: Theme.theme }))
  }

  public toggle (): void {
    this.set(Theme.themes[this.findThemeIndex() + 1] ?? Theme.themes[0])
  }

  protected findThemeIndex (): number {
    return Theme.themes.findIndex((theme) => {
      return document.body.classList.contains(theme)
    })
  }

  protected handleTheme (event: CustomEvent): void {
    if (
      isStruct(event.detail) &&
      event.detail.theme !== undefined
    ) {
      this.set(String(event.detail.theme))
    } else {
      this.toggle()
    }
  }
}
