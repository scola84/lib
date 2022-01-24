import type { ScolaElement } from '../elements/element'
import { ScolaIndexer } from './indexer'
import { ScolaInteract } from './interact'
import type { ScolaInteractEvent } from './interact'

export class ScolaDrag {
  public activeElement?: HTMLElement

  public element: ScolaElement

  public handle: boolean

  public indexer: ScolaIndexer

  public interact: ScolaInteract

  public template: HTMLTemplateElement | null

  public type: string

  protected handleDragendBound = this.handleDragend.bind(this)

  protected handleDragstartBound = this.handleDragstart.bind(this)

  protected handleInteractBound = this.handleInteract.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
    this.indexer = new ScolaIndexer()
    this.interact = new ScolaInteract(element)
    this.template = this.element.mutator.selectTemplate('drag')
    this.reset()
  }

  public connect (): void {
    this.interact.observe(this.handleInteractBound)
    this.interact.connect()
    this.addEventListeners()
  }

  public disconnect (): void {
    this.interact.disconnect()
    this.removeEventListeners()
  }

  public reset (): void {
    this.handle = this.element.hasAttribute('sc-drag-handle')
    this.interact.mouse = this.interact.hasMouse
    this.interact.touch = this.interact.hasTouch
    this.type = this.element.getAttribute('sc-drag-type') ?? ''
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

      const template = this.template?.content.cloneNode(true)

      if (template instanceof DocumentFragment) {
        const element = template.firstElementChild as ScolaElement | null

        document.body.appendChild(template)

        if (typeof element?.setData === 'function') {
          this.indexer.set(element)
          element.setData(this.element.getData())
          event.dataTransfer.setDragImage(element, 0, 0)
        }

        window.requestAnimationFrame(() => {
          if (element !== null) {
            this.indexer.remove(element)
            element.remove()
          }
        })
      }
    }
  }

  protected handleInteract (event: ScolaInteractEvent): boolean {
    switch (event.type) {
      case 'start':
        return this.handleInteractStart(event)
      default:
        return false
    }
  }

  protected handleInteractStart (event: ScolaInteractEvent): boolean {
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
