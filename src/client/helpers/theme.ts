import { isStruct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-theme': CustomEvent
  }

  interface WindowEventMap {
    'sc-theme': CustomEvent
  }
}

export class ScolaTheme {
  public static storage: Storage = localStorage

  public static theme: string

  public static themes = ['sc-light', 'sc-dark']

  protected handleThemeBound = this.handleTheme.bind(this)

  public constructor () {
    ScolaTheme.theme = ScolaTheme.themes[this.findThemeIndex()] ?? ScolaTheme.themes[0]
  }

  public listen (): void {
    document.body.addEventListener('sc-theme', this.handleThemeBound)
  }

  public setTheme (theme: string): void {
    document.body.classList.remove(ScolaTheme.theme)
    ScolaTheme.theme = theme
    document.body.classList.add(theme)
    ScolaTheme.storage.setItem('sc-theme', theme)
    window.dispatchEvent(new CustomEvent('sc-theme', { detail: ScolaTheme.theme }))
  }

  public toggleTheme (): void {
    this.setTheme(ScolaTheme.themes[this.findThemeIndex() + 1] ?? ScolaTheme.themes[0])
  }

  protected findThemeIndex (): number {
    return ScolaTheme.themes.findIndex((theme) => {
      return document.body.classList.contains(theme)
    })
  }

  protected handleTheme (event: CustomEvent): void {
    if (
      isStruct(event.detail) &&
      typeof event.detail.theme === 'string'
    ) {
      this.setTheme(event.detail.theme)
    } else {
      this.toggleTheme()
    }
  }
}
