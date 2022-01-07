import { absorb, cast, isArray, isStruct } from '../../common'
import { ScolaDrag } from '../helpers/drag'
import { ScolaDrop } from '../helpers/drop'
import type { ScolaElement } from './element'
import { ScolaHider } from '../helpers/hider'
import { ScolaInteract } from '../helpers/interact'
import type { ScolaInteractEvent } from '../helpers/interact'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPaste } from '../helpers/paste'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-fullscreen': CustomEvent
    'sc-drop-transfer': CustomEvent
  }
}

export class ScolaDivElement extends HTMLDivElement implements ScolaElement {
  public cancel: boolean

  public datamap: Struct = {}

  public drag?: ScolaDrag

  public drop?: ScolaDrop

  public hider?: ScolaHider

  public interact: ScolaInteract

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public paste?: ScolaPaste

  public propagator: ScolaPropagator

  protected handleContextmenuBound = this.handleContextmenu.bind(this)

  protected handleInteractBound = this.handleInteract.bind(this)

  protected handleMutationsBound = this.handleMutations.bind(this)

  protected handleTransferBound = this.handleTransfer.bind(this)

  public constructor () {
    super()
    this.interact = new ScolaInteract(this)
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)

    if (this.hasAttribute('sc-drag')) {
      this.drag = new ScolaDrag(this)
    }

    if (this.hasAttribute('sc-drop')) {
      this.drop = new ScolaDrop(this)
    }

    if (this.hasAttribute('sc-paste')) {
      this.paste = new ScolaPaste(this)
    }

    if (this.hasAttribute('sc-hide')) {
      this.hider = new ScolaHider(this)
    }

    this.reset()
  }

  public static define (): void {
    customElements.define('sc-div', ScolaDivElement, {
      extends: 'div'
    })
  }

  public connectedCallback (): void {
    this.interact.observe(this.handleInteractBound)

    this.observer.observe(this.handleMutationsBound, [
      'hidden',
      'sc-fullscreen'
    ])

    this.drag?.connect()
    this.drop?.connect()
    this.hider?.connect()
    this.interact.connect()
    this.mutator.connect()
    this.observer.connect()
    this.paste?.connect()
    this.propagator.connect()
    this.addEventListeners()
  }

  public disconnectedCallback (): void {
    this.drag?.disconnect()
    this.drop?.disconnect()
    this.hider?.disconnect()
    this.interact.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.paste?.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public getData (): Struct {
    return absorb(this.dataset, this.datamap, true)
  }

  public reset (): void {
    this.cancel = this.hasAttribute('sc-cancel')
    this.interact.keyboard = this.interact.hasKeyboard
    this.interact.mouse = this.interact.hasMouse
    this.interact.touch = this.interact.hasTouch
  }

  public setData (data: unknown): void {
    if (isStruct(data)) {
      Object.assign(this.datamap, data)
      this.propagator.set(data)
    }
  }

  public update (): void {}

  protected addEventListeners (): void {
    if (this.hasAttribute('sc-drop')) {
      this.addEventListener('sc-drop-transfer', this.handleTransferBound)
    }

    if (this.hasAttribute('sc-oncontextmenu')) {
      this.addEventListener('contextmenu', this.handleContextmenuBound)
    }
  }

  protected handleContextmenu (event: MouseEvent): void {
    event.preventDefault()
    this.propagator.dispatch('contextmenu', [this.getData()], event)
  }

  protected handleInteract (event: ScolaInteractEvent): boolean {
    let handled = false

    if (event.type === 'click') {
      if (
        !this.interact.isKeyboard(event.originalEvent, 'up') ||
        this.interact.isKey(event.originalEvent, 'Enter') ||
        this.interact.isKey(event.originalEvent, 'Space')
      ) {
        this.propagator.dispatch('click', [this.getData()], event.originalEvent)
        event.originalEvent.cancelBubble = this.cancel
        handled = true
      }
    }

    return handled
  }

  protected handleMutations (mutations: MutationRecord[]): void {
    const attributes = this.observer.normalize(mutations)

    if (attributes.includes('hidden')) {
      this.hider?.toggle()
    } else if (attributes.includes('sc-fullscreen')) {
      this.handleMutationsFullscreen()
    }
  }

  protected handleMutationsFullscreen (): void {
    if (document.fullscreenEnabled) {
      if (this.hasAttribute('sc-fullscreen')) {
        this.requestFullscreen().catch(() => {})
      } else {
        document.exitFullscreen().catch(() => {})
      }
    } else {
      this.removeAttribute('sc-fullscreen')
    }
  }

  protected handleTransfer (event: CustomEvent): void {
    if (
      isStruct(event.detail) &&
      isArray(event.detail.items)
    ) {
      if (cast(event.detail.copy) === true) {
        this.drop?.dropItems(event.detail.items, 'dropcopy', event)
      } else {
        this.drop?.dropItems(event.detail.items, 'drop', event)
      }
    }
  }

  protected removeEventListeners (): void {
    if (this.hasAttribute('sc-drop')) {
      this.removeEventListener('sc-drop-transfer', this.handleTransferBound)
    }

    if (this.hasAttribute('sc-oncontextmenu')) {
      this.removeEventListener('contextmenu', this.handleContextmenuBound)
    }
  }
}
