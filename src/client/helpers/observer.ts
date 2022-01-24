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

  public observer?: [(mutations: MutationRecord[]) => void, string[] | undefined]

  public observers: MutationObserver[] = []

  public save: string[]

  public storage: Storage

  public target: string[]

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

  public connect (): void {
    this.connectTargets()

    if (this.observer !== undefined) {
      this.connectSelf(...this.observer)
    }

    if (this.save.length > 0) {
      this.connectSelf(this.saveStateBound, this.save)
    }
  }

  public disconnect (): void {
    this.observers.forEach((observer) => {
      observer.disconnect()
    })

    this.observers = []
  }

  public normalize (mutations: MutationRecord[]): Array<string | null> {
    return mutations.map((mutation) => {
      return mutation.attributeName
    })
  }

  public observe (callback: (mutations: MutationRecord[]) => void, filter?: string[]): void {
    this.observer = [callback, filter]
  }

  public reset (): void {
    this.save = this.element
      .getAttribute('sc-observe-save')
      ?.trim()
      .split(/\s+/u) ?? []

    this.storage = ScolaObserver.storage[this.element.getAttribute('sc-observe-storage') ?? 'session'] ?? window.sessionStorage

    this.target = this.element.getAttribute('sc-observe-target')
      ?.trim()
      .split(/\s+/u) ?? []
  }

  protected connectSelf (callback: (mutations: MutationRecord[]) => void, filter?: string[]): void {
    const observer = new MutationObserver(callback)

    observer.observe(this.element, {
      attributeFilter: filter,
      attributes: true
    })

    this.observers.push(observer)
  }

  protected connectTargets (): void {
    this.target.forEach((target) => {
      const {
        filter = undefined,
        name = '',
        selector = ''
      } = ((/(?<name>.+)@(?<p>(?<filter>[^;]*);)?(?<selector>.+)/u).exec(target))?.groups ?? {}

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