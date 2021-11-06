import type { ScolaElement } from '../elements/element'
import type { ScolaTableElement } from '../elements/table'

export class ScolaDrag {
  public activeElement?: HTMLElement

  public element: ScolaTableElement

  public handle: boolean

  public template: HTMLTemplateElement | null

  public type: string

  protected handleDragendBound = this.handleDragend.bind(this)

  protected handleDragstartBound = this.handleDragstart.bind(this)

  protected handleMousedownBound = this.handleMousedown.bind(this)

  public constructor (element: ScolaTableElement) {
    this.element = element
    this.template = this.selectTemplate()
    this.reset()
  }

  public connect (): void {
    this.addEventListeners()
  }

  public disconnect (): void {
    this.removeEventListeners()
  }

  public reset (): void {
    this.handle = this.element.hasAttribute('sc-drag-handle')
    this.type = this.element.getAttribute('sc-drag-type') ?? ''
  }

  protected addEventListeners (): void {
    this.element.addEventListener('mousedown', this.handleMousedownBound)
    this.element.addEventListener('dragend', this.handleDragendBound)
    this.element.addEventListener('dragstart', this.handleDragstartBound)
  }

  protected handleDragend (): void {
    this.activeElement?.removeAttribute('draggable')
  }

  protected handleDragstart (event: DragEvent): void {
    if (
      this.type !== '' &&
      this.element.id !== '' &&
      event.dataTransfer !== null
    ) {
      if (this.element.select !== undefined) {
        event.dataTransfer.setData('sc-keys', JSON.stringify(this.element.select.getKeys()))
      }

      event.dataTransfer.setData('sc-origin', this.element.id)
      event.dataTransfer.setData('sc-type', this.type)

      const template = this.template?.content.cloneNode(true)

      if (template instanceof DocumentFragment) {
        const element = template.querySelector<ScolaElement>(':first-child')

        document
          .querySelector('.sc-app')
          ?.appendChild(template)

        if (element !== null) {
          element.setData({
            selected: this.element.select?.rows.length,
            ...this.element.select?.firstRow?.datamap
          })

          event.dataTransfer.setDragImage(element, 0, 0)

          window.requestAnimationFrame(() => {
            element.remove()
          })
        }
      }
    }
  }

  protected handleMousedown (event: MouseEvent): void {
    event.cancelBubble = true

    if (event.target instanceof HTMLElement) {
      if (
        this.handle &&
        event.target.closest('[sc-handle="drag"]') !== null
      ) {
        this.activeElement = event.target.closest('tr') ?? undefined
        this.activeElement?.setAttribute('draggable', 'true')
      }
    }
  }

  protected removeEventListeners (): void {
    this.element.removeEventListener('mousedown', this.handleMousedownBound)
    this.element.removeEventListener('dragend', this.handleDragendBound)
    this.element.removeEventListener('dragstart', this.handleDragstartBound)
  }

  protected selectTemplate (): HTMLTemplateElement | null {
    return this.element.querySelector('template[sc-name="drag"]')
  }
}
