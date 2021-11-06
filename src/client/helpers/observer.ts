import type { ScolaElement } from '../elements/element'
import type { Struct } from '../../common'
import { isStruct } from '../../common'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = ((observer: any, observable: any, mutations: MutationRecord[]) => void)

export class ScolaObserver {
  public static observers: Struct<Handler | undefined> = {}

  public static storage: Struct<Storage | undefined> = {
    local: window.localStorage,
    session: window.sessionStorage
  }

  public element: ScolaElement

  public observe: string[]

  public observers: MutationObserver[] = []

  public save: string[]

  public storage: Storage

  protected saveStateBound = this.saveState.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
    this.reset()

    if (this.save.length > 0) {
      this.loadState()
    }
  }

  public static define (name: string, handler: Handler): void {
    ScolaObserver.observers[name] = handler
  }

  public static defineObservers (observers: Struct<Handler>): void {
    Object
      .entries(observers)
      .forEach(([name, handler]) => {
        ScolaObserver.define(name, handler)
      })
  }

  public connect (callback?: (mutations: MutationRecord[]) => void, filter?: string[]): void {
    this.connectOthers()

    if (this.save.length > 0) {
      this.connectSelf(this.saveStateBound, this.save)
    }

    if (callback !== undefined) {
      this.connectSelf(callback, filter)
    }
  }

  public disconnect (): void {
    this.observers.forEach((observer) => {
      observer.disconnect()
    })

    this.observers = []
  }

  public reset (): void {
    this.observe = this.element.getAttribute('sc-observe')?.split(' ') ?? []
    this.save = this.element.getAttribute('sc-observe-save')?.split(' ') ?? []
    this.storage = ScolaObserver.storage[this.element.getAttribute('sc-observe-storage') ?? 'session'] ?? window.sessionStorage
  }

  protected connectOthers (): void {
    this.observe.forEach((observe) => {
      const {
        filter = undefined,
        name = '',
        selector = ''
      } = ((/(?<name>.+)@(?<p>(?<filter>[^;]*);)?(?<selector>.+)/u).exec(observe))?.groups ?? {}

      const callback = ScolaObserver.observers[name]

      if (
        callback !== undefined &&
        selector !== ''
      ) {
        document
          .querySelectorAll(selector)
          .forEach((element) => {
            const observer = new MutationObserver(callback.bind(null, this.element, element))

            observer.observe(element, {
              attributeFilter: filter?.split(','),
              attributes: true
            })

            this.observers.push(observer)
            window.requestAnimationFrame(callback.bind(null, this.element, element, []))
          })
      }
    })
  }

  protected connectSelf (callback: (mutations: MutationRecord[]) => void, filter?: string[]): void {
    const observer = new MutationObserver(callback)

    observer.observe(this.element, {
      attributeFilter: filter,
      attributes: true
    })

    this.observers.push(observer)
  }

  protected loadState (): void {
    const statesString = this.storage.getItem(`sc-observe-${this.element.id}`)

    if (statesString !== null) {
      const states = JSON.parse(statesString) as Struct

      if (isStruct(states)) {
        Object
          .entries(states)
          .forEach(([name, value]) => {
            if (value === null) {
              this.element.removeAttribute(name)
            } else {
              this.element.setAttribute(name, String(value))
            }
          })
      }
    }
  }

  protected saveState (): void {
    const states: Struct = this.save.reduce((result, name) => {
      return {
        ...result,
        [name]: this.element.getAttribute(name)
      }
    }, {})

    this.storage.setItem(`sc-observe-${this.element.id}`, JSON.stringify(states))
  }
}
