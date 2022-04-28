import { Interactor } from './interactor'
import type { InteractorEvent } from './interactor'
import type { ScolaTableElement } from '../elements'
import { ScolaTableRowElement } from '../elements'
import type { Struct } from '../../common'
import { isStruct } from '../../common'

export class TableSorter {
  public element: ScolaTableElement

  public interactor: Interactor

  public type: string

  protected handleDragoverBound = this.handleDragover.bind(this)

  protected handleInteractorBound = this.handleInteractor.bind(this)

  public constructor (element: ScolaTableElement) {
    this.element = element
    this.interactor = new Interactor(element.body)
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
    this.interactor.keyboard = this.interactor.hasKeyboard
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
    } = this.element.selector?.firstRow ?? {}

    const {
      offsetHeight: lastRowHeight = 0,
      offsetLeft: lastRowLeft = 0,
      offsetTop: lastRowTop = 0,
      offsetWidth: lastRowWidth = 0
    } = this.element.selector?.lastRow ?? {}

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

    if (
      isStruct(drag) &&
      drag.type === this.type
    ) {
      const origin = document.getElementById(String(drag.origin))

      if (
        origin === this.element &&
        event.target instanceof HTMLElement
      ) {
        const target = event.target.closest<ScolaTableRowElement>('tr')

        if (target instanceof ScolaTableRowElement) {
          let row: HTMLElement | null = null

          if (
            this.element.selector?.rows.length === 1 &&
            this.element.selector.firstRow instanceof ScolaTableRowElement
          ) {
            row = this.element.selector.firstRow
          } else if (
            this.element.dragger?.activeElement instanceof ScolaTableRowElement
          ) {
            row = this.element.dragger.activeElement
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

            this.element.propagator.dispatchEvents('sort', [row.data], event)
          }
        }
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
    if (this.interactor.isKeyboard(event.originalEvent, 'down')) {
      return this.handleInteractorStartKeyboard(event.originalEvent)
    }

    return false
  }

  protected handleInteractorStartKeyboard (event: KeyboardEvent): boolean {
    let handled = false

    if (
      event.ctrlKey &&
      !event.shiftKey
    ) {
      if (this.interactor.isKeyForward(event)) {
        handled = this.handleInteractorStartKeyboardForward(event)
      } else if (this.interactor.isKeyBack(event)) {
        handled = this.handleInteractorStartKeyboardBack(event)
      }
    }

    if (handled) {
      this.scrollTo()
      event.preventDefault()
    }

    return handled
  }

  protected handleInteractorStartKeyboardBack (event: KeyboardEvent): boolean {
    if (this.element.selector?.firstRow?.previousElementSibling !== null) {
      this.element.selector?.rows.forEach((row) => {
        row.parentElement?.insertBefore(row, row.previousElementSibling)
        this.element.propagator.dispatchEvents('sort', [row.data], event)
      })

      return true
    }

    return false
  }

  protected handleInteractorStartKeyboardForward (event: KeyboardEvent): boolean {
    if (this.element.selector?.lastRow?.nextElementSibling !== null) {
      this.element.selector?.rows
        .slice()
        .reverse()
        .forEach((row) => {
          row.parentElement?.insertBefore(row, row.nextElementSibling?.nextElementSibling ?? null)
          this.element.propagator.dispatchEvents('sort', [row.data], event)
        })

      return true
    }

    return false
  }

  protected removeEventListeners (): void {
    this.element.body.removeEventListener('dragover', this.handleDragoverBound)
  }
}
