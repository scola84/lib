import type { Flow, User } from '../../common/'
import { Hider, Mutator, Observer, Propagator } from '../helpers'
import { Struct, isFlow, isUser } from '../../common'
import type { ScolaElement } from './element'
import { toJoint } from '../../common/'

export class ScolaAuthElement extends HTMLDivElement implements ScolaElement {
  public static storage: Partial<Struct<Storage>> = {
    local: window.localStorage,
    session: window.sessionStorage
  }

  public flow: Flow | null = null

  public hider?: Hider

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public storage: Storage

  public user: User | null = null

  public get data (): unknown {
    return {
      flow: this.flow,
      user: this.user
    }
  }

  public set data (data: unknown) {
    if (isUser(data)) {
      this.user = data
    } else {
      this.flow = null
      this.user = null
    }

    this.saveState()
    this.update()
  }

  protected handleObserverBound = this.handleObserver.bind(this)

  public constructor () {
    super()
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)

    if (this.hasAttribute('sc-hide')) {
      this.hider = new Hider(this)
    }

    this.reset()
  }

  public static define (): void {
    customElements.define('sc-auth', ScolaAuthElement, {
      extends: 'div'
    })
  }

  public connectedCallback (): void {
    this.observer.observe(this.handleObserverBound, [
      'hidden'
    ])

    this.hider?.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.loadState()
  }

  public disconnectedCallback (): void {
    this.hider?.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
  }

  public notify (): void {
    this.toggleAttribute('sc-updated', true)
    this.toggleAttribute('sc-updated', false)
    this.propagator.dispatchEvents('update')
  }

  public reset (): void {
    this.storage = ScolaAuthElement.storage[this.getAttribute('sc-storage') ?? 'session'] ?? window.sessionStorage
  }

  public toJSON (): unknown {
    return {
      id: this.id,
      is: this.getAttribute('is'),
      nodeName: this.nodeName
    }
  }

  public update (): void {
    this.updateAttributes()
    this.notify()
  }

  public updateAttributes (): void {
    this.toggleAttribute('sc-user', this.user !== null)
    this.toggleAttribute('hidden', this.user !== null)
  }

  protected handleObserver (mutations: MutationRecord[]): void {
    const attributes = this.observer.normalizeMutations(mutations)

    if (attributes.includes('hidden')) {
      this.hider?.toggle()
    }
  }

  protected loadState (): void {
    const state = JSON.parse(this.storage.getItem('sc-auth') ?? 'null') as Struct | null

    if (isUser(state?.user)) {
      this.user = state?.user ?? null
    }

    if (isFlow(state?.flow)) {
      this.flow = state?.flow ?? null
    }

    if (window.location.search.length > 0) {
      this.loadStateFromLocation()
    }

    if (this.flow !== null) {
      this.propagator.dispatchEvents(toJoint(this.flow.next, {
        chars: /[^a-z0-9]+/gui
      }), [this.flow.data])

      this.flow = null
    } else if (this.user !== null) {
      this.propagator.dispatchEvents('authload', [this.user])
    }

    this.update()
  }

  protected loadStateFromLocation (): void {
    const flow = Struct.fromQuery(window.location.search.slice(1))

    if (
      isFlow(flow) &&
      flow.next.startsWith('auth_')
    ) {
      this.flow = flow
      this.saveState()
      window.location.search = ''
    }
  }

  protected saveState (): void {
    this.storage.setItem('sc-auth', JSON.stringify({
      flow: this.flow,
      user: this.user
    }))
  }
}
