import { ScolaRowElement } from '../elements/row'
import type { ScolaTableElement } from '../elements/table'

export class ScolaSort {
  public element: ScolaTableElement

  public type: string

  protected handleDragoverBound = this.handleDragover.bind(this)

  protected handleKeydownBound = this.handleKeydown.bind(this)

  public constructor (element: ScolaTableElement) {
    this.element = element
    this.reset()
  }

  public connect (): void {
    this.addEventListeners()
  }

  public disconnect (): void {
    this.removeEventListeners()
  }

  public reset (): void {
    this.type = this.element.getAttribute('sc-sort-type') ?? ''
  }

  protected addEventListeners (): void {
    this.element.addEventListener('keydown', this.handleKeydownBound)
    this.element.body.addEventListener('dragover', this.handleDragoverBound)
  }

  protected handleDragover (event: DragEvent): void {
    event.preventDefault()

    if (event.dataTransfer?.getData('sc-type') === this.type) {
      const origin = document.getElementById(event.dataTransfer.getData('sc-origin'))

      if (
        origin === this.element &&
        event.target instanceof HTMLElement
      ) {
        const target = event.target.closest<ScolaRowElement>('tr')

        if (target instanceof ScolaRowElement) {
          let row: HTMLElement | null = null

          if (
            this.element.select?.handle === false &&
              this.element.select.rows.length === 1 &&
              this.element.select.firstRow instanceof ScolaRowElement
          ) {
            row = this.element.select.firstRow
          } else if (
            this.element.drag?.handle === true &&
            this.element.drag.activeElement instanceof ScolaRowElement
          ) {
            row = this.element.drag.activeElement
          }

          if (row instanceof ScolaRowElement) {
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

  protected handleKeydown (event: KeyboardEvent): void {
    let handled = false

    if (
      event.ctrlKey &&
      !event.shiftKey
    ) {
      if (
        event.code === 'ArrowDown' ||
        event.code === 'ArrowRight'
      ) {
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
      } else if (
        event.code === 'ArrowLeft' ||
        event.code === 'ArrowUp'
      ) {
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
  }

  protected removeEventListeners (): void {
    this.element.removeEventListener('keydown', this.handleKeydownBound)
    this.element.body.removeEventListener('dragover', this.handleDragoverBound)
  }

  protected scrollTo (): void {
    const {
      clientHeight: bodyHeight,
      scrollTop: bodyScrollTop
    } = this.element.body

    const {
      offsetTop: firstRowTop = 0
    } = this.element.select?.firstRow ?? {}

    const {
      clientHeight: lastRowHeight = 0,
      offsetTop: lastRowTop = 0
    } = this.element.select?.lastRow ?? {}

    let top = this.element.body.scrollTop

    if ((lastRowTop + lastRowHeight) > (bodyScrollTop + bodyHeight)) {
      top = lastRowTop + lastRowHeight - bodyHeight
    } else if (firstRowTop < bodyScrollTop) {
      top = firstRowTop
    }

    this.element.body.scrollTo({
      top
    })
  }
}
