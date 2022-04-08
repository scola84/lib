import { Struct, cast, isPrimitive, isStruct } from '../../common'
import { Sanitizer } from './sanitizer'
import type { ScolaElement } from '../elements'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = ((observer: any, observable: any, mutations: MutationRecord[]) => void)

export class Observer {
  public static handlers: Partial<Struct<Handler>> = {}

  public static storage: Partial<Struct<Storage>> = {
    local: window.localStorage,
    session: window.sessionStorage
  }

  public element: ScolaElement

  public observer?: [(mutations: MutationRecord[]) => void, string[] | undefined]

  public observers: MutationObserver[] = []

  public parent: Document | Element = document

  public sanitizer: Sanitizer

  public save: string[]

  public states: string[]

  public statesInverse: string[]

  public storage: Storage

  public target: string[]

  public wait: boolean

  protected handleHiddenBound = this.handleHidden.bind(this)

  protected saveStateBound = this.saveState.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
    this.sanitizer = new Sanitizer()
    this.reset()

    if (this.save.length > 0) {
      this.loadState()
    }
  }

  public static defineHandlers (handlers: Struct<Handler>): void {
    Object
      .entries(handlers)
      .forEach(([name, handler]) => {
        Observer.handlers[name] = handler
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

  public normalizeMutations (mutations: MutationRecord[]): string[] {
    return mutations.map((mutation) => {
      return mutation.attributeName ?? ''
    })
  }

  public observe (callback: (mutations: MutationRecord[]) => void, filter?: string[]): void {
    this.observer = [callback, filter]
  }

  public reset (): void {
    this.parent = this.getParent(this.element.getAttribute('sc-observe-parent'))

    this.save = this.element
      .getAttribute('sc-observe-save')
      ?.trim()
      .split(/\s+/u) ?? []

    this.states = this.element
      .getAttribute('sc-observe-state')
      ?.split(/\s+/u) ?? []

    this.statesInverse = this.element
      .getAttribute('sc-observe-state-inv')
      ?.split(/\s+/u) ?? []

    this.storage = Observer.storage[this.element.getAttribute('sc-observe-storage') ?? 'session'] ?? window.sessionStorage

    this.target = this.element
      .getAttribute('sc-observe-target')
      ?.trim()
      .split(/\s+/u) ?? []

    this.wait = this.element.hasAttribute('sc-observe-wait')
  }

  public toggleState (force: boolean): void {
    this.states.forEach((state) => {
      this.element.toggleAttribute(state, force)
    })

    this.statesInverse.forEach((state) => {
      this.element.toggleAttribute(state, !force)
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
      const [
        nameAndFilter,
        selector
      ] = target.split('@')

      const [
        name,
        filter = undefined
      ] = nameAndFilter.split(/\?(?<filter>.+)/u)

      const filters = filter?.split('&')
      const handler = Observer.handlers[name]

      if (
        handler !== undefined &&
        selector !== ''
      ) {
        this.parent
          .querySelectorAll<ScolaElement>(selector)
          .forEach((element) => {
            const observerHandler = handler.bind(null, this.element, element)
            const observer = new MutationObserver(observerHandler)

            observer.observe(element, {
              attributeFilter: filters,
              attributes: true
            })

            this.observers.push(observer)

            if (!this.wait) {
              observerHandler([])
            }
          })
      }
    })
  }

  protected getParent (selector: string | null): Document | Element {
    if (selector === null) {
      return document
    }

    return this.element.closest(selector) ?? document
  }

  protected handleHidden (): void {
    if (this.element.hasAttribute('hidden')) {
      this.element.propagator.dispatch('hide', [this.element.data])
    } else {
      this.element.propagator.dispatch('show', [this.element.data])
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
            const castValue = cast(value)

            if (castValue === null) {
              this.element.removeAttribute(name)
            } else if (isPrimitive(castValue)) {
              const attrValue = castValue.toString()

              if (this.sanitizer.checkAttribute(this.element.nodeName, name, attrValue)) {
                this.element.setAttribute(name, attrValue)
              }
            }
          })
      }
    }
  }

  protected saveState (): void {
    const states: Struct = this.save.reduce<Struct>((result, name) => {
      return {
        ...result,
        [name]: this.element.getAttribute(name)
      }
    }, Struct.create())

    this.storage.setItem(`sc-observe-${this.element.id}`, JSON.stringify(states))
  }
}
