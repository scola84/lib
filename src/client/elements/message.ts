import { ScolaDivElement } from './div'
import type { ScolaElement } from './element'
import { ScolaHider } from '../helpers/hider'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'
import { isStruct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-message-add': CustomEvent
    'sc-message-clear': CustomEvent
    'sc-message-next': CustomEvent
  }
}

export class ScolaMessageElement extends HTMLDivElement implements ScolaElement {
  public activeElement?: HTMLElement

  public hider?: ScolaHider

  public items: Struct[] = []

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public template: HTMLTemplateElement | null

  public timeout: number

  public timeoutId?: number

  protected handleAddBound = this.handleAdd.bind(this)

  protected handleClearBound = this.handleClear.bind(this)

  protected handleMutationsBound = this.handleMutations.bind(this)

  protected handleNextBound = this.handleNext.bind(this)

  public constructor () {
    super()
    this.template = this.selectTemplate()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)

    if (this.hasAttribute('sc-hide')) {
      this.hider = new ScolaHider(this)
    }

    this.reset()
  }

  public static define (): void {
    customElements.define('sc-message', ScolaMessageElement, {
      extends: 'div'
    })
  }

  public connectedCallback (): void {
    this.observer.connect(this.handleMutationsBound, [
      'hidden'
    ])

    this.mutator.connect()
    this.propagator.connect()
    this.hider?.connect()
    this.addEventListeners()
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.hider?.disconnect()
    this.removeEventListeners()
  }

  public getData (): void {}

  public reset (): void {
    this.timeout = Number(this.getAttribute('sc-timeout') ?? -1)
  }

  public setData (): void {}

  public update (): void {
    this.updateElements()

    if (this.timeout === -1) {
      this.changeFocus()
    }
  }

  public updateElements (): void {
    if (
      this.timeout > -1 &&
      this.items.length > 0
    ) {
      this.timeoutId = window.setTimeout(() => {
        this.timeoutId = undefined
        this.update()
      }, this.timeout)
    }

    const item = this.items.shift()

    if (item === undefined) {
      this.toggleAttribute('hidden', true)
      return
    }

    this.appendElement(item)
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-message-add', this.handleAddBound)
    this.addEventListener('sc-message-clear', this.handleClearBound)
    this.addEventListener('sc-message-next', this.handleNextBound)
  }

  protected appendElement (item: Struct): void {
    const template = this.template?.content.cloneNode(true)

    if (template instanceof DocumentFragment) {
      const element = template.firstElementChild ?? undefined

      this.firstElementChild?.remove()
      this.appendChild(template)

      if (element instanceof ScolaDivElement) {
        element.setData(item)
      }

      this.toggleAttribute('hidden', false)
    }
  }

  protected changeFocus (): void {
    if (this.activeElement === undefined) {
      const element = this.querySelector('button, input, select, textarea')

      if (
        element instanceof HTMLElement &&
        document.activeElement instanceof HTMLElement
      ) {
        this.activeElement = document.activeElement

        window.requestAnimationFrame(() => {
          element.focus()
        })
      }
    } else if (this.items.length === 0) {
      this.activeElement.focus()
      this.activeElement = undefined
    }
  }

  protected handleAdd (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this.items.push(event.detail)

      if (this.timeoutId === undefined) {
        this.update()
      }
    }
  }

  protected handleClear (): void {
    if (this.timeoutId !== undefined) {
      window.clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    }

    this.items = []
    this.update()
  }

  protected handleMutations (): void {
    this.hider?.toggle()
  }

  protected handleNext (): void {
    if (this.timeoutId !== undefined) {
      window.clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    }

    this.update()
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-message-add', this.handleAddBound)
    this.removeEventListener('sc-message-clear', this.handleClearBound)
    this.removeEventListener('sc-message-next', this.handleNextBound)
  }

  protected selectTemplate (): HTMLTemplateElement | null {
    return this.querySelector('template[sc-name="item"]')
  }
}
