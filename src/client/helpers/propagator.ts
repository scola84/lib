import type { ScolaElement } from '../elements/element'
import { ScolaEvent } from './event'
import { isStruct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-data-set': CustomEvent
  }
}

export class ScolaPropagator {
  public static selector = '[is^="sc-"]:not([sc-nodata])'

  public element: ScolaElement

  protected handleSetBound = this.handleSet.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
  }

  public connect (): void {
    this.addEventListeners()
  }

  public disconnect (): void {
    this.removeEventListeners()
  }

  public dispatch (on: string, data: unknown[], trigger?: Event): void {
    this.element
      .getAttribute(`sc-on${on}`)
      ?.split(' ')
      .forEach((event) => {
        this.dispatchEvent(event, data, trigger)
      })
  }

  public dispatchEvent (event: string, data: unknown[], trigger?: Event): void {
    const [
      name = '',
      selector = ''
    ] = event.split('@')

    if (name !== '') {
      let targets: HTMLElement[] | NodeList = []

      if (selector === '') {
        targets = [this.element]
      } else {
        targets = document.querySelectorAll(selector)
      }

      data.forEach((datum) => {
        targets.forEach((target) => {
          target.dispatchEvent(new ScolaEvent(name, {
            bubbles: target === this.element,
            detail: datum,
            element: this.element,
            trigger
          }))
        })
      })
    }
  }

  public set (data: unknown): void {
    let targets = this.element.getAttribute('sc-data-target')

    if (targets === null) {
      targets = ''
    }

    targets
      .split(' ')
      .forEach((target) => {
        this.setData(data, target)
      })
  }

  public setData (data: unknown, target: string): void {
    let selector = ''
    let source: Document | Element | null = null

    if (target === '') {
      ({ selector } = ScolaPropagator)
      source = this.element
    } else {
      selector = target
      source = document
    }

    source
      .querySelectorAll<ScolaElement>(selector)
      .forEach((element) => {
        const name = element.getAttribute('sc-data-name') ?? ''

        if (
          isStruct(data) &&
          data[name] !== undefined
        ) {
          element.setData(data[name])
        } else {
          element.setData(data)
        }
      })
  }

  protected addEventListeners (): void {
    this.element.addEventListener('sc-data-set', this.handleSetBound)
  }

  protected handleSet (event: CustomEvent): void {
    this.element.setData(event.detail)
  }

  protected removeEventListeners (): void {
    this.element.removeEventListener('sc-data-set', this.handleSetBound)
  }
}
