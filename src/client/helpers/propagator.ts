import { I18n, Struct, isArray, isNil, isObject, isStruct } from '../../common'
import type { ScolaElement } from '../elements'
import { ScolaEvent } from './event'

declare global {
  interface HTMLElementEventMap {
    'sc-data-set': CustomEvent
  }
}

export interface PropagatorEvent {
  data?: Struct
  filter?: string
  name: string
  selector: string
}

export class Propagator {
  public static selector = ':scope > [is^="sc-"]:not([sc-nodata])'

  public cancel: boolean

  public element: ScolaElement

  public events: Struct<PropagatorEvent[] | undefined> = {}

  public i18n: I18n

  public keydown: string[][]

  protected handleSetBound = this.handleSet.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
    this.i18n = new I18n()
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

  public dispatchEvent<T = unknown> (event: PropagatorEvent, data: T[] = [Struct.create()], trigger?: Event): void {
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
            detail: this.createDetail(event, dispatchData),
            element: this.element,
            trigger: trigger
          }))
        })
      })
    })
  }

  public parseEvents (events: string, data?: Struct): PropagatorEvent[] {
    return events
      .trim()
      .split(/\s+/u)
      .map((event) => {
        const [
          nameAndFilter,
          selector
        ] = event.split('@')

        const [
          name,
          filter = undefined
        ] = nameAndFilter.split(/\?(?<filter>.+)/u)

        return {
          data,
          filter,
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
      target.data = data[name]
    } else {
      target.data = data
    }
  }

  protected addEventListeners (): void {
    this.element.addEventListener('sc-data-set', this.handleSetBound)
  }

  protected createDetail (event: PropagatorEvent, data?: unknown): Struct | unknown[] | undefined {
    if (isArray(data)) {
      return data
    }

    let detail = event.data

    if (isStruct(data)) {
      detail = {
        ...detail,
        ...data
      }
    } else if (isObject(data)) {
      detail = data
    }

    if (isNil(event.filter)) {
      return detail
    }

    return Struct.fromQuery(this.i18n.format(event.filter, detail))
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
    this.element.data = event.detail
  }

  protected removeEventListeners (): void {
    this.element.removeEventListener('sc-data-set', this.handleSetBound)
  }
}
