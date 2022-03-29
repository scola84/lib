import type { ScolaElement } from '../elements'
import { ScolaEvent } from './event'
import type { Struct } from '../../common'
import { isStruct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-data-set': CustomEvent
  }
}

export interface PropagatorEvent {
  data: Struct
  name: string
  selector: string
}

export class Propagator {
  public static selector = ':scope > [is^="sc-"]:not([sc-nodata])'

  public cancel: boolean

  public element: ScolaElement

  public events: Struct<PropagatorEvent[] | undefined> = {}

  public keydown: string[][]

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

  public dispatch<T = unknown>(on: string, data?: T[], trigger?: Event): boolean {
    let dispatched = false

    this
      .getEvents(on)
      .forEach((event) => {
        if (event.selector === 'console') {
          // eslint-disable-next-line no-console
          console.log(on, data)
        } else {
          dispatched = true
          this.dispatchEvent(event, data, trigger)
        }
      })

    return dispatched
  }

  public dispatchEvent (event: PropagatorEvent, data: unknown[] = [undefined], trigger?: Event): void {
    let targets: HTMLElement[] | NodeList = []

    if (event.selector === '') {
      targets = [this.element]
    } else {
      targets = document.querySelectorAll(event.selector)
    }

    data.forEach((dispatchData) => {
      targets.forEach((target) => {
        window.requestAnimationFrame(() => {
          target.dispatchEvent(new ScolaEvent(event.name, {
            bubbles: target === this.element,
            detail: this.createDetail(event.data, dispatchData),
            element: this.element,
            trigger: trigger
          }))
        })
      })
    })
  }

  public extractMessage (error: unknown): string {
    if (
      error instanceof Error ||
      error instanceof ErrorEvent
    ) {
      return error.message
        .replace('Error:', '')
        .trim()
    }

    return String(error)
  }

  public parseEvents (events: string): PropagatorEvent[] {
    return events
      .trim()
      .split(' ')
      .map((event) => {
        const [nameAndDataString, selector] = event.split('@')
        const [name, dataString = undefined] = nameAndDataString.split('?')
        const data = Object.fromEntries(new URLSearchParams(dataString))
        return {
          data,
          name,
          selector
        }
      })
  }

  public set (data: unknown): void {
    this.element
      .querySelectorAll<ScolaElement>(Propagator.selector)
      .forEach((target) => {
        this.setData(target, data)
      })
  }

  public setData (target: ScolaElement, data: unknown): void {
    const name = (
      target.getAttribute('sc-data-name') ??
      target.getAttribute('name') ??
      ''
    )

    if (
      isStruct(data) &&
      data[name] !== undefined
    ) {
      target.setData(data[name])
    } else {
      target.setData(data)
    }
  }

  protected addEventListeners (): void {
    this.element.addEventListener('sc-data-set', this.handleSetBound)
  }

  protected createDetail (eventData: Struct, data: unknown): unknown {
    let detail = data

    if (
      isStruct(detail) &&
      Object.keys(detail).length === 0
    ) {
      detail = undefined
    }

    return detail ?? eventData
  }

  protected getEvents (on: string): PropagatorEvent[] {
    let events = this.events[on]

    if (events === undefined) {
      const eventsString = this.element.getAttribute(`sc-on${on}`)

      if (eventsString === null) {
        events = []
      } else {
        events = this.parseEvents(eventsString)
      }

      this.events[on] = events
    }

    return events
  }

  protected handleSet (event: CustomEvent): void {
    this.element.setData(event.detail)
  }

  protected removeEventListeners (): void {
    this.element.removeEventListener('sc-data-set', this.handleSetBound)
  }
}
