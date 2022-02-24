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

  public templates: Map<string, HTMLTemplateElement>

  public timeout: number

  public timeoutId?: number

  protected handleAddBound = this.handleAdd.bind(this)

  protected handleClearBound = this.handleClear.bind(this)

  protected handleNextBound = this.handleNext.bind(this)

  protected handleObserverBound = this.handleObserver.bind(this)

  public constructor () {
    super()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.templates = this.mutator.selectTemplates()

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
    this.observer.observe(this.handleObserverBound, [
      'hidden'
    ])

    this.hider?.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()
  }

  public disconnectedCallback (): void {
    this.hider?.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public getData (): void {}

  public isSame (): void {}

  public reset (): void {
    this.timeout = Number(this.getAttribute('sc-timeout') ?? -1)
  }

  public setData (): void {}

  public update (): void {
    this.updateElements()
    this.updateAttributes()
    this.propagator.dispatch('update')
  }

  public updateAttributes (): void {
    this.setAttribute('sc-updated', Date.now().toString())
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
    const template = this.templates.get('item')?.content.cloneNode(true)

    if (
      template instanceof DocumentFragment &&
      template.firstElementChild !== null
    ) {
      const element = template.firstElementChild

      this.firstElementChild?.remove()
      this.appendChild(template)

      if (element instanceof ScolaDivElement) {
        element.setData(item)
      } else {
        window.requestAnimationFrame(() => {
          if (element instanceof ScolaDivElement) {
            element.setData(item)
          }
        })
      }

      this.toggleAttribute('hidden', false)
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

  protected handleNext (): void {
    if (this.timeoutId !== undefined) {
      window.clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    }

    this.update()
  }

  protected handleObserver (): void {
    this.hider?.toggle()
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-message-add', this.handleAddBound)
    this.removeEventListener('sc-message-clear', this.handleClearBound)
    this.removeEventListener('sc-message-next', this.handleNextBound)
  }
}
