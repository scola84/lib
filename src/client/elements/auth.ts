import type { Flow, User } from '../../common/'
import { Hider, Mutator, Observer, Propagator } from '../helpers'
import { Struct, isFlow, isUser, revive } from '../../common'
import { isError, isUserToken, toJoint } from '../../common/'
import Cookie from 'js-cookie'
import type { ScolaElement } from './element'
import type { ScolaViewElement } from './view'

declare global {
  interface WindowEventMap {
    'sc-auth-error': CustomEvent<() => void>
  }
}

export class ScolaAuthElement extends HTMLDivElement implements ScolaElement {
  public static storage: Partial<Struct<Storage>> = {
    local: window.localStorage,
    session: window.sessionStorage
  }

  public callbacks: Array<() => void> = []

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
      this.login(data)
    } else if (isError(data)) {
      if (data.code.endsWith('401')) {
        this.logout()
      } else {
        this.propagator.dispatchEvents('error', [data])
      }
    } else {
      this.logout()
    }
  }

  protected handleErrorBound = this.handleError.bind(this)

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

  protected addEventListeners (): void {
    window.addEventListener('sc-auth-error', this.handleErrorBound)
  }

  protected clearViews (): void {
    document
      .querySelectorAll<ScolaViewElement>('[is="sc-view"]')
      .forEach((element) => {
        element.clear()
      })
  }

  protected handleError (event: WindowEventMap['sc-auth-error']): void {
    this.callbacks.push(event.detail)
    this.logout(false)
  }

  protected handleObserver (mutations: MutationRecord[]): void {
    const attributes = this.observer.normalizeMutations(mutations)

    if (attributes.includes('hidden')) {
      this.hider?.toggle()
    }
  }

  protected loadState (): void {
    if (this.storage.getItem('sc-auth') !== null) {
      this.loadStateFromStorage()
    }

    if (window.location.search.length > 0) {
      this.loadStateFromLocation()
    }

    if (this.flow !== null) {
      this.propagator.dispatchEvents(toJoint(this.flow.next, {
        chars: /[^a-z0-9]+/gui
      }), [this.flow.data])
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
      this.setFlow(flow)
      this.saveState()
      window.history.replaceState(null, '', window.location.pathname)
    }
  }

  protected loadStateFromStorage (): void {
    const state = JSON.parse(this.storage.getItem('sc-auth') ?? 'null', revive) as Struct | null

    if (state !== null) {
      if (isUser(state.user)) {
        this.setUser(state.user)
      }
    }
  }

  protected loadViews (): void {
    document
      .querySelectorAll<ScolaViewElement>('[is="sc-view"]')
      .forEach((element) => {
        if (typeof this.user?.views?.[element.id] === 'string') {
          element.load({
            name: String(this.user.views[element.id])
          })
        } else {
          element.load()
        }
      })
  }

  protected login (user: User): void {
    this.user = user
    this.saveState()
    this.update()

    if (this.callbacks.length > 0) {
      this.resolveCallbacks()
    } else {
      this.loadViews()
    }
  }

  protected logout (clear = true): void {
    this.flow = null
    this.user = null
    this.saveState()
    this.update()

    if (clear) {
      this.clearViews()
    }
  }

  protected removeEventListeners (): void {
    window.removeEventListener('sc-auth-error', this.handleErrorBound)
  }

  protected resolveCallbacks (): void {
    try {
      this.callbacks.forEach((callback) => {
        callback()
      })
    } finally {
      this.callbacks = []
    }
  }

  protected saveState (): void {
    this.storage.setItem('sc-auth', JSON.stringify({
      user: this.user
    }))
  }

  protected setFlow (flow: Flow): void {
    this.flow = flow

    if (isUserToken(this.flow.data, true)) {
      if (this.flow.data.date_expires < new Date()) {
        this.flow.next += '_expired'
      } else {
        Cookie.set(this.flow.next, this.flow.data.hash, {
          expires: this.flow.data.date_expires,
          path: '/',
          sameSite: 'strict',
          secure: true
        })
      }
    }
  }

  protected setUser (user: User): void {
    this.user = user
  }
}
