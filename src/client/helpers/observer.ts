import type { ScolaElement } from '../elements/element'
import { ScolaSanitizer } from './sanitizer'
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

  public sanitizer: ScolaSanitizer

  public save: string[]

  public state: string[]

  public storage: Storage

  public target: string[]

  public wait: boolean

  protected handleHiddenBound = this.handleHidden.bind(this)

  protected saveStateBound = this.saveState.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
    this.sanitizer = new ScolaSanitizer()
    this.reset()

    if (this.save.length > 0) {
      this.loadState()
    }
  }

  public static defineObservers (observers: Struct<Handler>): void {
    Object
      .entries(observers)
      .forEach(([name, handler]) => {
        ScolaObserver.observers[name] = handler
      })
  }

  public connect (): void {
    this.connectTargets()

    if (this.observer !== undefined) {
      this.connectSelf(...this.observer)
    }

    if (
      this.element.hasAttribute('sc-onhide') ||
      this.element.hasAttribute('sc-onshow')
    ) {
      this.connectSelf(this.handleHiddenBound, [
        'hidden'
      ])
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

    this.state = this.element
      .getAttribute('sc-observe-state')
      ?.split(' ') ?? []

    this.storage = ScolaObserver.storage[this.element.getAttribute('sc-observe-storage') ?? 'session'] ?? window.sessionStorage

    this.target = this.element
      .getAttribute('sc-observe-target')
      ?.trim()
      .split(/\s+/u) ?? []

    this.wait = this.element.hasAttribute('sc-observe-wait')
  }

  public toggle (force: boolean): void {
    this.state.forEach((state) => {
      this.element.toggleAttribute(state, force)
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

  protected connectTargets (): void {
    this.target.forEach((target) => {
      const [nameAndFilterString, selector] = target.split('@')
      const [name, filterString = undefined] = nameAndFilterString.split('?')
      const filter = filterString?.split('&')
      const callback = ScolaObserver.observers[name]

      if (
        callback !== undefined &&
        selector !== ''
      ) {
        document
          .querySelectorAll(selector)
          .forEach((element) => {
            const handler = callback.bind(null, this.element, element)
            const observer = new MutationObserver(handler)

            observer.observe(element, {
              attributeFilter: filter,
              attributes: true
            })

            this.observers.push(observer)

            if (!this.wait) {
              handler([])
            }
          })
      }
    })
  }

  protected handleHidden (): void {
    if (this.element.hasAttribute('hidden')) {
      this.element.propagator.dispatch('hide', [this.element.getData()])
    } else {
      this.element.propagator.dispatch('show', [this.element.getData()])
    }
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
            } else if (this.sanitizer.checkAttribute(this.element.nodeName, name, String(value))) {
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
