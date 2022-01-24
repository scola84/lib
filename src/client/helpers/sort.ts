import { ScolaInteract } from './interact'
import type { ScolaInteractEvent } from './interact'
import type { ScolaTableElement } from '../elements/table'
import { ScolaTableRowElement } from '../elements/table-row'
import type { Struct } from '../../common'

export class ScolaSort {
  public element: ScolaTableElement

  public interact: ScolaInteract

  public type: string

  protected handleDragoverBound = this.handleDragover.bind(this)

  protected handleInteractBound = this.handleInteract.bind(this)

  public constructor (element: ScolaTableElement) {
    this.element = element
    this.interact = new ScolaInteract(element.body)
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
    this.interact.keyboard = this.interact.hasKeyboard
    this.type = this.element.getAttribute('sc-sort-type') ?? ''
  }

  public scrollTo (): void {
    const {
      offsetHeight: bodyHeight,
      offsetLeft: bodyLeft,
      offsetTop: bodyTop,
      offsetWidth: bodyWidth,
      scrollLeft: bodyScrollLeft,
      scrollTop: bodyScrollTop
    } = this.element.body

    const {
      offsetLeft: firstRowLeft = 0,
      offsetTop: firstRowTop = 0
    } = this.element.select?.firstRow ?? {}

    const {
      offsetHeight: lastRowHeight = 0,
      offsetLeft: lastRowLeft = 0,
      offsetTop: lastRowTop = 0,
      offsetWidth: lastRowWidth = 0
    } = this.element.select?.lastRow ?? {}

    let left = bodyScrollLeft
    let top = bodyScrollTop

    if ((lastRowTop - bodyTop + lastRowHeight) > (bodyScrollTop + bodyHeight)) {
      top = lastRowTop - bodyTop + lastRowHeight - bodyHeight
    } else if ((firstRowTop - bodyTop) < bodyScrollTop) {
      top = firstRowTop - bodyTop
    }

    if ((lastRowLeft - bodyLeft + lastRowWidth) > (bodyScrollLeft + bodyWidth)) {
      left = lastRowLeft - bodyLeft + lastRowWidth - bodyWidth
    } else if ((firstRowLeft - bodyLeft) < bodyScrollLeft) {
      left = firstRowLeft - bodyLeft
    }

    this.element.body.scrollTo({
      left,
      top
    })
  }

  protected addEventListeners (): void {
    this.element.body.addEventListener('dragover', this.handleDragoverBound)
  }

  protected handleDragover (event: DragEvent): void {
    event.preventDefault()

    const drag = JSON.parse(window.sessionStorage.getItem('sc-drag') ?? '{}') as Struct

    if (drag.type === this.type) {
      const origin = document.getElementById(String(drag.origin))

      if (
        origin === this.element &&
        event.target instanceof HTMLElement
      ) {
        const target = event.target.closest<ScolaTableRowElement>('tr')

        if (target instanceof ScolaTableRowElement) {
          let row: HTMLElement | null = null

          if (
            this.element.select?.rows.length === 1 &&
            this.element.select.firstRow instanceof ScolaTableRowElement
          ) {
            row = this.element.select.firstRow
          } else if (
            this.element.drag?.activeElement instanceof ScolaTableRowElement
          ) {
            row = this.element.drag.activeElement
          }

          if (
            row instanceof ScolaTableRowElement &&
            row !== target
          ) {
            if (row.rowIndex < target.rowIndex) {
              target.parentElement?.insertBefore(row, target.nextElementSibling)
            } else {
              target.parentElement?.insertBefore(row, target)
            }

            this.element.propagator.dispatch('sort', [row.getData()], event)
          }
        }
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
    if (this.interact.isKeyboard(event.originalEvent, 'down')) {
      return this.handleInteractStartKeyboard(event.originalEvent)
    }

    return false
  }

  protected handleInteractStartKeyboard (event: KeyboardEvent): boolean {
    let handled = false

    if (
      event.ctrlKey &&
      !event.shiftKey
    ) {
      if (this.interact.isKeyForward(event)) {
        if (this.element.select?.lastRow?.nextElementSibling !== null) {
          handled = true

          this.element.select?.rows
            .slice()
            .reverse()
            .forEach((row) => {
              row.parentElement?.insertBefore(row, row.nextElementSibling?.nextElementSibling ?? null)
              this.element.propagator.dispatch('sort', [row.getData()], event)
            })
        }
      } else if (this.interact.isKeyBack(event)) {
        if (this.element.select?.firstRow?.previousElementSibling !== null) {
          handled = true

          this.element.select?.rows.forEach((row) => {
            row.parentElement?.insertBefore(row, row.previousElementSibling)
            this.element.propagator.dispatch('sort', [row.getData()], event)
          })
        }
      }
    }

    if (handled) {
      this.scrollTo()
      event.preventDefault()
    }

    return handled
  }

  protected removeEventListeners (): void {
    this.element.body.removeEventListener('dragover', this.handleDragoverBound)
  }
}
