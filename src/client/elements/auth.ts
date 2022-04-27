import { Hider, Mutator, Observer, Propagator } from '../helpers'
import { Struct, isNil, isStruct, isUser } from '../../common'
import type { ScolaElement } from './element'
import type { User } from '../../common/'

declare global {
  // interface HTMLElementEventMap {
  // }
}

interface AuthFlow {
  data: unknown
  type: string
}

export class ScolaAuthElement extends HTMLDivElement implements ScolaElement {
  public flow: AuthFlow | null = null

  public hider?: Hider

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

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
    } else if (this.isFlow(data)) {
      this.flow = data
    } else if (isNil(data)) {
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
    this.addEventListeners()
    this.loadState()
  }

  public disconnectedCallback (): void {
    this.hider?.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public notify (): void {
    this.toggleAttribute('sc-updated', true)
    this.toggleAttribute('sc-updated', false)
    this.propagator.dispatch('update')
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

    if (this.flow !== null) {
      this.propagator.dispatch(this.flow.type, [this.flow.data])
    } else if (this.user !== null) {
      this.propagator.dispatch('load', [this.user])
    }
  }

  public updateAttributes (): void {
    this.toggleAttribute('sc-user', this.user !== null)
    this.toggleAttribute('hidden', this.user !== null)
  }

  protected addEventListeners (): void {

  }

  protected handleObserver (mutations: MutationRecord[]): void {
    const attributes = this.observer.normalizeMutations(mutations)

    if (attributes.includes('hidden')) {
      this.hider?.toggle()
    }
  }

  protected isFlow (value: unknown): value is AuthFlow {
    return (
      isStruct(value)
    ) && (
      typeof value.type === 'string'
    ) && (
      value.data === undefined ||
      isStruct(value.data)
    )
  }

  protected loadState (): void {
    const state = JSON.parse(sessionStorage.getItem('sc-auth') ?? 'null') as Struct | null

    if (isUser(state?.user)) {
      this.user = state?.user ?? null
    }

    if (this.isFlow(state?.flow)) {
      this.flow = state?.flow ?? null
    }

    if (window.location.search.length > 0) {
      this.flow = Struct.fromQuery(window.location.search.slice(1))
      this.saveState()
      window.location.search = ''
    }

    this.update()
  }

  protected removeEventListeners (): void {

  }

  protected saveState (): void {
    sessionStorage.setItem('sc-auth', JSON.stringify({
      flow: this.flow,
      user: this.user
    }))
  }
}
