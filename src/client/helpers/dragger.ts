import { Indexer } from './indexer'
import { Interactor } from './interactor'
import type { InteractorEvent } from './interactor'
import type { ScolaElement } from '../elements'

export class Dragger {
  public activeElement?: HTMLElement

  public data: unknown

  public element: ScolaElement

  public handle: boolean

  public indexer: Indexer

  public interactor: Interactor

  public templates: Map<string, HTMLTemplateElement>

  public type: string

  protected handleDragendBound = this.handleDragend.bind(this)

  protected handleDragstartBound = this.handleDragstart.bind(this)

  protected handleInteractorBound = this.handleInteractor.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
    this.indexer = new Indexer()
    this.interactor = new Interactor(element)
    this.templates = this.element.mutator.selectTemplates()
    this.reset()
  }

  public connect (): void {
    this.interactor.observe(this.handleInteractorBound)
    this.interactor.connect()
    this.addEventListeners()
  }

  public disconnect (): void {
    this.interactor.disconnect()
    this.removeEventListeners()
  }

  public reset (): void {
    this.handle = this.element.hasAttribute('sc-drag-handle')
    this.interactor.mouse = this.interactor.hasMouse
    this.interactor.touch = this.interactor.hasTouch
    this.type = this.element.getAttribute('sc-drag-type') ?? ''
  }

  public setData (data: unknown): void {
    this.data = data
  }

  protected addEventListeners (): void {
    this.element.addEventListener('dragend', this.handleDragendBound)
    this.element.addEventListener('dragstart', this.handleDragstartBound)
  }

  protected handleDragend (): void {
    this.activeElement?.removeAttribute('draggable')
    window.sessionStorage.removeItem('sc-drag')
  }

  protected handleDragstart (event: DragEvent): void {
    if (
      this.type !== '' &&
      this.element.id !== '' &&
      event.dataTransfer !== null
    ) {
      event.dataTransfer.setData('sc-origin', this.element.id)

      window.sessionStorage.setItem('sc-drag', JSON.stringify({
        origin: this.element.id,
        type: this.type
      }))

      const template = this.templates.get('drag')?.content.cloneNode(true)

      if (template instanceof DocumentFragment) {
        const element = template.firstElementChild as ScolaElement

        document.body.appendChild(template)
        this.indexer.set(element)
        element.data = this.data
        event.dataTransfer.setDragImage(element, 0, 0)

        window.requestAnimationFrame(() => {
          this.indexer.remove(element)
          element.remove()
        })
      }
    }
  }

  protected handleInteractor (event: InteractorEvent): boolean {
    switch (event.type) {
      case 'start':
        return this.handleInteractorStart(event)
      default:
        return false
    }
  }

  protected handleInteractorStart (event: InteractorEvent): boolean {
    if (
      this.handle &&
      event.originalEvent.target instanceof HTMLElement &&
      event.originalEvent.target.closest('[sc-handle="drag"]') !== null
    ) {
      this.activeElement = event.originalEvent.target.closest<HTMLElement>('[sc-draggable]') ?? undefined
      this.activeElement?.setAttribute('draggable', 'true')
    }

    return false
  }

  protected removeEventListeners (): void {
    this.element.removeEventListener('dragend', this.handleDragendBound)
    this.element.removeEventListener('dragstart', this.handleDragstartBound)
  }
}
