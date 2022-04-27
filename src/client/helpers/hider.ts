import { Breakpoint } from './breakpoint'
import type { BreakpointEvent } from './breakpoint'
import { Indexer } from './indexer'
import { Interactor } from './interactor'
import type { InteractorEvent } from './interactor'
import type { ScolaElement } from '../elements'

declare global {
  interface HTMLElementEventMap {
    'sc-hide-modal': CustomEvent
  }
}

type Direction = 'down' | 'end' | 'start' | 'up'

type MarginProperty = 'margin-bottom' | 'margin-left' | 'margin-right' | 'margin-top'

type Mode = 'center' | 'height' | 'move-bottom' | 'move-end' | 'move-start' | 'move-top' | 'opacity' | null

type SizeProperty = 'offsetHeight' | 'offsetWidth'

export class Hider {
  public static distanceThreshold = 0.1

  public static selector = '[is^="sc-"]'

  public activeElement?: HTMLElement

  public backdrop: HTMLElement | null

  public breakpoint: Breakpoint

  public direction?: Direction[]

  public distanceThreshold: number

  public element: ScolaElement

  public immediate = true

  public indexer: Indexer

  public interactor: Interactor

  public mode: Mode | null

  public transition: boolean

  protected handleBreakpointBound = this.handleBreakpoint.bind(this)

  protected handleHideModalBound = this.handleHideModal.bind(this)

  protected handleInteractorBound = this.handleInteractor.bind(this)

  protected handleTransitionendBound = this.handleTransitionend.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
    this.backdrop = this.selectBackdrop()
    this.breakpoint = new Breakpoint(element)
    this.indexer = new Indexer()
    this.interactor = new Interactor(element)

    if (this.breakpoint.parseAttribute('sc-hide-initial') === '') {
      this.element.toggleAttribute('hidden', true)
    }

    this.reset()
    this.toggle()
  }

  public connect (): void {
    this.breakpoint.observe(this.handleBreakpointBound)
    this.interactor.observe(this.handleInteractorBound)
    this.breakpoint.connect()
    this.interactor.connect()
    this.addEventListeners()
  }

  public disconnect (): void {
    this.breakpoint.disconnect()
    this.interactor.disconnect()
    this.removeEventListeners()
  }

  public hideModal (): boolean {
    if (window.getComputedStyle(this.element).getPropertyValue('position') === 'fixed') {
      this.element.toggleAttribute('hidden', true)
      return true
    }

    return false
  }

  public reset (): void {
    this.direction = this.breakpoint.parseAttribute('sc-hide-direction')
      ?.trim()
      .split(/\s+/u) as Direction[]

    this.transition = this.breakpoint.parseAttribute('sc-transition') === ''
    this.indexer.index = this.element.getAttribute('sc-hide-index')
    this.interactor.cancel = true
    this.interactor.edgeThreshold = Number(this.breakpoint.parseAttribute('sc-hide-interact-edge-threshold') ?? Interactor.edgeThreshold)
    this.interactor.keyboard = this.breakpoint.parseAttribute('sc-hide-interact-keyboard') === ''
    this.interactor.mouse = this.breakpoint.parseAttribute('sc-hide-interact-mouse') === ''
    this.interactor.target = 'window'
    this.interactor.touch = this.breakpoint.parseAttribute('sc-hide-interact-touch') === ''
    this.mode = this.breakpoint.parseAttribute('sc-hide-mode') as Mode
    this.distanceThreshold = Number(this.breakpoint.parseAttribute('sc-hide-distance-threshold') ?? Hider.distanceThreshold)
  }

  public toggle (): void {
    switch (this.mode) {
      case 'center':
        this.toggleCenter()
        break
      case 'height':
        this.toggleHeight()
        break
      case 'move-bottom':
        this.toggleMoveBottom()
        break
      case 'move-end':
        this.toggleMoveEnd()
        break
      case 'move-start':
        this.toggleMoveStart()
        break
      case 'move-top':
        this.toggleMoveTop()
        break
      case 'opacity':
        this.toggleOpacity()
        break
      default:
        break
    }
  }

  protected addEventListeners (): void {
    this.element.addEventListener('sc-hide-modal', this.handleHideModalBound)
    this.element.addEventListener('transitionend', this.handleTransitionendBound)
  }

  protected changeFocus (): void {
    if (this.element.hasAttribute('hidden')) {
      this.activeElement?.focus()
      this.activeElement = undefined
    } else {
      const element = this.element.querySelector('[sc-focus~="hide"]')

      if (element instanceof HTMLElement) {
        if (document.activeElement instanceof HTMLElement) {
          this.activeElement = document.activeElement
        }

        window.requestAnimationFrame(() => {
          element.focus()
        })
      }
    }
  }

  protected finalize (): void {
    if (this.transition) {
      this.immediate = false
    }

    this.element.style.removeProperty('transition-timing-function')

    if (this.element.hasAttribute('hidden')) {
      this.element.style.setProperty('display', 'none', 'important')
      this.backdrop?.style.setProperty('display', 'none', 'important')
      this.indexer.remove(this.element, this.backdrop)
      this.element.propagator.dispatch('afterhide', [this.element.data])
    } else {
      this.element.propagator.dispatch('aftershow', [this.element.data])
    }

    this.changeFocus()
  }

  protected handleBreakpoint (event: BreakpointEvent): void {
    if (event.changed) {
      this.interactor.disconnect()
      this.reset()
      this.interactor.connect()
    }

    if (!this.element.hasAttribute('hidden')) {
      this.immediate = true
      this.toggle()
    }
  }

  protected handleHideModal (): void {
    this.hideModal()
  }

  protected handleInteractor (event: InteractorEvent): boolean {
    switch (event.type) {
      case 'end':
        return this.handleInteractorEnd(event)
      case 'move':
        return this.handleInteractorMove(event)
      case 'start':
        return this.handleInteractorStart(event)
      default:
        return false
    }
  }

  protected handleInteractorEnd (event: InteractorEvent): boolean {
    let handled = false

    if (this.mode?.startsWith('move-') === true) {
      if (this.shouldMoveBottom(event)) {
        handled = this.handleInteractorEndMoveBottom(event)
      } else if (this.shouldMoveLeft(event)) {
        handled = this.handleInteractorEndMoveLeft(event)
      } else if (this.shouldMoveRight(event)) {
        handled = this.handleInteractorEndMoveRight(event)
      } else if (this.shouldMoveTop(event)) {
        handled = this.handleInteractorEndMoveTop(event)
      }
    }

    if (!handled) {
      if (this.element.hasAttribute('hidden')) {
        this.element.style.setProperty('display', 'none', 'important')
        this.backdrop?.style.setProperty('display', 'none', 'important')
      } else if (
        this.backdrop?.hasAttribute('hidden') === false &&
        !event.originalEvent.composedPath().includes(this.element)
      ) {
        this.hideModal()
      }
    }

    return handled
  }

  protected handleInteractorEndMoveBottom (event: InteractorEvent): boolean {
    this.setTimingFunction(event.velocityY)

    if (this.element.hasAttribute('hidden')) {
      if (
        event.distanceY < (-this.element.offsetHeight * this.distanceThreshold) &&
        event.startEdges.bottom &&
        this.direction?.includes('up') !== false
      ) {
        this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
      } else {
        this.immediate = this.isHiddenByMargin(window.getComputedStyle(this.element).getPropertyValue('margin-bottom'), this.element.offsetHeight)
        this.toggleMoveHidden('margin-bottom', 'offsetHeight')
      }
    } else if (
      event.distanceY > (this.element.offsetHeight * this.distanceThreshold) &&
      this.direction?.includes('down') !== false
    ) {
      this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
    } else {
      this.immediate = this.isVisibleByMargin(window.getComputedStyle(this.element).getPropertyValue('margin-bottom'))
      this.toggleMoveVisible('margin-bottom')
    }

    return true
  }

  protected handleInteractorEndMoveLeft (event: InteractorEvent): boolean {
    this.setTimingFunction(event.velocityX)

    if (this.element.hasAttribute('hidden')) {
      if (
        event.distanceX > (this.element.offsetWidth * this.distanceThreshold) &&
        event.startEdges.left &&
        this.direction?.includes(this.resolveDirection('end')) !== false
      ) {
        this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
      } else {
        this.immediate = this.isHiddenByMargin(window.getComputedStyle(this.element).getPropertyValue('margin-left'), this.element.offsetWidth)
        this.toggleMoveHidden('margin-left', 'offsetWidth')
      }
    } else if (
      event.distanceX < (-this.element.offsetWidth * this.distanceThreshold) &&
      this.direction?.includes(this.resolveDirection('start')) !== false
    ) {
      this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
    } else {
      this.immediate = this.isVisibleByMargin(window.getComputedStyle(this.element).getPropertyValue('margin-left'))
      this.toggleMoveVisible('margin-left')
    }

    return true
  }

  protected handleInteractorEndMoveRight (event: InteractorEvent): boolean {
    this.setTimingFunction(event.velocityX)

    if (this.element.hasAttribute('hidden')) {
      if (
        event.distanceX < (-this.element.offsetWidth * this.distanceThreshold) &&
        event.startEdges.right &&
        this.direction?.includes(this.resolveDirection('start')) !== false
      ) {
        this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
      } else {
        this.immediate = this.isHiddenByMargin(window.getComputedStyle(this.element).getPropertyValue('margin-right'), this.element.offsetWidth)
        this.toggleMoveHidden('margin-right', 'offsetWidth')
      }
    } else if (
      event.distanceX > (this.element.offsetWidth * this.distanceThreshold) &&
      this.direction?.includes(this.resolveDirection('end')) !== false
    ) {
      this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
    } else {
      this.immediate = this.isVisibleByMargin(window.getComputedStyle(this.element).getPropertyValue('margin-right'))
      this.toggleMoveVisible('margin-right')
    }

    return true
  }

  protected handleInteractorEndMoveTop (event: InteractorEvent): boolean {
    this.setTimingFunction(event.velocityY)

    if (this.element.hasAttribute('hidden')) {
      if (
        event.distanceY > (this.element.offsetHeight * this.distanceThreshold) &&
        event.startEdges.top &&
        this.direction?.includes('down') !== false
      ) {
        this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
      } else {
        this.immediate = this.isHiddenByMargin(window.getComputedStyle(this.element).getPropertyValue('margin-top'), this.element.offsetHeight)
        this.toggleMoveHidden('margin-top', 'offsetHeight')
      }
    } else if (
      event.distanceY < (-this.element.offsetHeight * this.distanceThreshold) &&
      this.direction?.includes('up') !== false
    ) {
      this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
    } else {
      this.immediate = this.isVisibleByMargin(window.getComputedStyle(this.element).getPropertyValue('margin-top'))
      this.toggleMoveVisible('margin-top')
    }

    return true
  }

  protected handleInteractorMove (event: InteractorEvent): boolean {
    if (this.shouldMoveBottom(event)) {
      return this.handleInteractorMoveBottom(event)
    } else if (this.shouldMoveLeft(event)) {
      return this.handleInteractorMoveLeft(event)
    } else if (this.shouldMoveRight(event)) {
      return this.handleInteractorMoveRight(event)
    } else if (this.shouldMoveTop(event)) {
      return this.handleInteractorMoveTop(event)
    }

    return false
  }

  protected handleInteractorMoveBottom (event: InteractorEvent): boolean {
    if (this.element.hasAttribute('hidden')) {
      if (
        this.isValidMargin(-this.element.offsetHeight - event.distanceY, -this.element.offsetHeight, 0) &&
        event.startEdges.bottom &&
        this.direction?.includes('up') !== false
      ) {
        this.moveMargin('bottom', -this.element.offsetHeight - event.distanceY, this.element.offsetHeight)
        return true
      }
    } else if (
      this.isValidMargin(-event.distanceY, -this.element.offsetHeight, 0) &&
      this.direction?.includes('down') !== false
    ) {
      this.moveMargin('bottom', -event.distanceY, this.element.offsetHeight)
      return true
    }

    return false
  }

  protected handleInteractorMoveLeft (event: InteractorEvent): boolean {
    if (this.element.hasAttribute('hidden')) {
      if (
        this.isValidMargin(-this.element.offsetWidth + event.distanceX, -this.element.offsetWidth, 0) &&
        event.startEdges.left &&
        this.direction?.includes(this.resolveDirection('end')) !== false
      ) {
        this.moveMargin('left', -this.element.offsetWidth + event.distanceX, this.element.offsetWidth)
        return true
      }
    } else if (
      this.isValidMargin(event.distanceX, -this.element.offsetWidth, 0) &&
      this.direction?.includes(this.resolveDirection('start')) !== false
    ) {
      this.moveMargin('left', event.distanceX, this.element.offsetWidth)
      return true
    }

    return false
  }

  protected handleInteractorMoveRight (event: InteractorEvent): boolean {
    if (this.element.hasAttribute('hidden')) {
      if (
        this.isValidMargin(-this.element.offsetWidth - event.distanceX, -this.element.offsetWidth, 0) &&
        event.startEdges.right &&
        this.direction?.includes(this.resolveDirection('start')) !== false
      ) {
        this.moveMargin('right', -this.element.offsetWidth - event.distanceX, this.element.offsetWidth)
        return true
      }
    } else if (
      this.isValidMargin(-event.distanceX, -this.element.offsetWidth, 0) &&
      this.direction?.includes(this.resolveDirection('end')) !== false
    ) {
      this.moveMargin('right', -event.distanceX, this.element.offsetWidth)
      return true
    }

    return false
  }

  protected handleInteractorMoveTop (event: InteractorEvent): boolean {
    if (this.element.hasAttribute('hidden')) {
      if (
        this.isValidMargin(-this.element.offsetHeight + event.distanceY, -this.element.offsetHeight, 0) &&
        event.startEdges.top &&
        this.direction?.includes('down') !== false
      ) {
        this.moveMargin('top', -this.element.offsetHeight + event.distanceY, this.element.offsetHeight)
        return true
      }
    } else if (
      this.isValidMargin(event.distanceY, -this.element.offsetHeight, 0) &&
      this.direction?.includes('up') !== false
    ) {
      this.moveMargin('top', event.distanceY, this.element.offsetHeight)
      return true
    }

    return false
  }

  protected handleInteractorStart (event: InteractorEvent): boolean {
    let handled = false

    if (this.interactor.isKeyboard(event.originalEvent)) {
      if (this.interactor.isKey(event.originalEvent, 'Escape')) {
        this.hideModal()
      }
    } else if (this.mode?.startsWith('move-') === true) {
      if (this.shouldMove(event)) {
        if (this.shouldMoveBottom(event)) {
          handled = this.handleInteractorStartMoveBottom()
        } else if (this.shouldMoveLeft(event)) {
          handled = this.handleInteractorStartMoveLeft()
        } else if (this.shouldMoveRight(event)) {
          handled = this.handleInteractorStartMoveRight()
        } else if (this.shouldMoveTop(event)) {
          handled = this.handleInteractorStartMoveTop()
        }
      }

      if (handled) {
        this.element.style.removeProperty('display')
        this.element.style.setProperty('transition-property', 'none')
        this.backdrop?.style.removeProperty('display')
        this.backdrop?.style.setProperty('transition-property', 'none')
        this.indexer.set(this.element, this.backdrop)
      }
    } else {
      handled = true
    }

    return handled
  }

  protected handleInteractorStartMoveBottom (): boolean {
    window.requestAnimationFrame(() => {
      if (this.element.hasAttribute('hidden')) {
        this.element.style.setProperty('margin-bottom', `-${this.element.offsetHeight}px`)
      }
    })

    return true
  }

  protected handleInteractorStartMoveLeft (): boolean {
    window.requestAnimationFrame(() => {
      if (this.element.hasAttribute('hidden')) {
        this.element.style.setProperty('margin-left', `-${this.element.offsetWidth}px`)
      }
    })

    return true
  }

  protected handleInteractorStartMoveRight (): boolean {
    window.requestAnimationFrame(() => {
      if (this.element.hasAttribute('hidden')) {
        this.element.style.setProperty('margin-right', `-${this.element.offsetWidth}px`)
      }
    })

    return true
  }

  protected handleInteractorStartMoveTop (): boolean {
    window.requestAnimationFrame(() => {
      if (this.element.hasAttribute('hidden')) {
        this.element.style.setProperty('margin-top', `-${this.element.offsetHeight}px`)
      }
    })

    return true
  }

  protected handleTransitionend (event: TransitionEvent): void {
    if (event.target === this.element) {
      this.finalize()
    }
  }

  protected isHiddenByMargin (margin: string, size: number): boolean {
    return Math.abs(Math.round(parseFloat(margin))) === size
  }

  protected isValidMargin (margin: number, min: number, max: number): boolean {
    return margin > min && margin < max
  }

  protected isVisibleByMargin (margin: string): boolean {
    return Math.round(parseFloat(margin)) === 0
  }

  protected moveMargin (property: string, margin: number, size: number): void {
    this.element.style.setProperty(`margin-${property}`, `${margin}px`)
    this.backdrop?.style.setProperty('opacity', (1 - Math.abs(margin / size)).toString())
  }

  protected removeEventListeners (): void {
    this.element.removeEventListener('sc-hide-modal', this.handleHideModalBound)
    this.element.removeEventListener('transitionend', this.handleTransitionendBound)
  }

  protected resolveDirection (direction: Direction): Direction {
    if (
      direction === 'end' &&
      this.interactor.dir === 'rtl'
    ) {
      return 'start'
    } else if (
      direction === 'start' &&
      this.interactor.dir === 'rtl'
    ) {
      return 'end'
    }

    return direction
  }

  protected selectBackdrop (): HTMLElement | null {
    const { nextElementSibling } = this.element

    if (
      nextElementSibling?.hasAttribute('sc-backdrop') === true &&
      nextElementSibling instanceof HTMLElement
    ) {
      return nextElementSibling
    }

    return null
  }

  protected setTimingFunction (velocity: number): void {
    this.element.style.setProperty('transition-timing-function', this.interactor.getTimingFunction(velocity))
  }

  protected shouldMove (event: InteractorEvent): boolean {
    if (this.element.hasAttribute('hidden')) {
      if (event.originalEvent.target instanceof HTMLElement) {
        const element = event.originalEvent.target.closest('[sc-hide-mode]')
        const backdrop = event.originalEvent.target.closest('[sc-backdrop]')

        if ((
          element !== null &&
          element !== this.element
        ) || (
          backdrop !== null &&
          backdrop !== this.backdrop
        )) {
          return false
        }
      }
    } else {
      const path = event.originalEvent.composedPath()

      if ((
        !path.includes(this.element)
      ) && (
        this.backdrop === null ||
        !path.includes(this.backdrop)
      )) {
        return false
      }
    }

    return true
  }

  protected shouldMoveBottom (event: InteractorEvent): boolean {
    if (this.mode === 'move-bottom') {
      if (event.type === 'end') {
        this.toggleScrollElement(event, true)

        return (
          event.axis === 'y' &&
          !event.startScroll.top
        )
      } else if (event.type === 'start') {
        return true
      } else if (event.axis === 'y') {
        if (event.directionY === 'down') {
          if (!event.startScroll.top) {
            this.toggleScrollElement(event, false)
            return true
          }
        } else {
          return true
        }
      }
    }

    return false
  }

  protected shouldMoveLeft (event: InteractorEvent): boolean {
    if ((
      this.mode === 'move-start' &&
      this.interactor.dir === 'ltr'
    ) || (
      this.mode === 'move-end' &&
      this.interactor.dir === 'rtl'
    )) {
      if (event.type === 'end') {
        this.toggleScrollElement(event, true)

        return (
          event.axis === 'x' &&
          !event.startScroll.right
        )
      } else if (event.type === 'start') {
        return true
      } else if (event.axis === 'x') {
        if (event.directionX === 'left') {
          if (!event.startScroll.right) {
            this.toggleScrollElement(event, false)
            return true
          }
        } else {
          return true
        }
      }
    }

    return false
  }

  protected shouldMoveRight (event: InteractorEvent): boolean {
    if ((
      this.mode === 'move-end' &&
      this.interactor.dir === 'ltr'
    ) || (
      this.mode === 'move-start' &&
      this.interactor.dir === 'rtl'
    )) {
      if (event.type === 'end') {
        this.toggleScrollElement(event, true)

        return (
          event.axis === 'x' &&
          !event.startScroll.left
        )
      } else if (event.type === 'start') {
        return true
      } else if (event.axis === 'x') {
        if (event.directionX === 'right') {
          if (!event.startScroll.left) {
            this.toggleScrollElement(event, false)
            return true
          }
        } else {
          return true
        }
      }
    }

    return false
  }

  protected shouldMoveTop (event: InteractorEvent): boolean {
    if (this.mode === 'move-top') {
      if (event.type === 'end') {
        this.toggleScrollElement(event, true)

        return (
          event.axis === 'y' &&
          !event.startScroll.bottom
        )
      } else if (event.type === 'start') {
        return true
      } else if (event.axis === 'y') {
        if (event.directionY === 'up') {
          if (!event.startScroll.bottom) {
            this.toggleScrollElement(event, false)
            return true
          }
        } else {
          return true
        }
      }
    }

    return false
  }

  protected toggleCenter (): void {
    if (this.element.hasAttribute('hidden')) {
      this.toggleCenterHidden()
    } else {
      this.toggleCenterVisible()
    }
  }

  protected toggleCenterHidden (): void {
    if (this.immediate) {
      this.element.style.setProperty('margin-bottom', `-${this.element.offsetHeight}px`)
      this.backdrop?.style.setProperty('opacity', '0')
      this.finalize()
    } else {
      this.element.style.setProperty('transition-property', 'margin-bottom')
      this.backdrop?.style.setProperty('transition-property', 'opacity')

      window.requestAnimationFrame(() => {
        this.element.style.setProperty('margin-bottom', `-${this.element.offsetHeight}px`)
        this.backdrop?.style.setProperty('opacity', '0')
      })
    }
  }

  protected toggleCenterVisible (): void {
    this.element.style.removeProperty('display')
    this.element.style.setProperty('margin-bottom', `-${this.element.offsetHeight}px`)
    this.backdrop?.style.removeProperty('display')
    this.backdrop?.style.setProperty('opacity', '0')
    this.indexer.set(this.element, this.backdrop)

    window.requestAnimationFrame(() => {
      if (this.immediate) {
        this.element.style.setProperty('transition-property', 'none')
        this.backdrop?.style.setProperty('transition-property', 'none')
      } else {
        this.element.style.setProperty('transition-property', 'margin-bottom')
        this.backdrop?.style.setProperty('transition-property', 'opacity')
      }

      window.requestAnimationFrame(() => {
        const left = (window.innerWidth - this.element.offsetWidth) / 2
        const top = (window.innerHeight - this.element.offsetHeight) / 2

        this.element.style.setProperty('margin-bottom', `${top}px`)
        this.element.style.setProperty('margin-left', `${left}px`)
        this.backdrop?.style.setProperty('opacity', '1')

        if (this.immediate) {
          this.finalize()
        }
      })
    })
  }

  protected toggleHeight (): void {
    if (this.element.hasAttribute('hidden')) {
      this.toggleHeightHidden()
    } else {
      this.toggleHeightVisible()
    }
  }

  protected toggleHeightHidden (): void {
    if (this.immediate) {
      this.element.style.setProperty('height', '0px')
      this.finalize()
    } else {
      this.element.style.setProperty('transition-property', 'height')

      window.requestAnimationFrame(() => {
        this.element.style.setProperty('height', `${this.element.scrollHeight}px`)

        window.requestAnimationFrame(() => {
          this.element.style.setProperty('height', '0px')
        })
      })
    }
  }

  protected toggleHeightVisible (): void {
    this.element.style.removeProperty('display')

    window.requestAnimationFrame(() => {
      if (this.immediate) {
        this.element.style.setProperty('transition-property', 'none')
      } else {
        this.element.style.setProperty('transition-property', 'height')
      }

      window.requestAnimationFrame(() => {
        if (this.element.offsetHeight === 0) {
          if (
            this.element.scrollHeight > 0 &&
            window.getComputedStyle(this.element).getPropertyValue('overflow') === 'hidden'
          ) {
            this.element.style.setProperty('height', `${this.element.scrollHeight}px`)
          } else {
            this.element.style.removeProperty('height')
          }
        }

        if (this.immediate) {
          this.finalize()
        }
      })
    })
  }

  protected toggleMove (margin: MarginProperty, size: SizeProperty): void {
    if (this.element.hasAttribute('hidden')) {
      this.toggleMoveHidden(margin, size)
    } else {
      this.toggleMoveVisible(margin, size)
    }
  }

  protected toggleMoveBottom (): void {
    this.toggleMove('margin-bottom', 'offsetHeight')
  }

  protected toggleMoveEnd (): void {
    if (this.interactor.dir === 'ltr') {
      this.toggleMove('margin-right', 'offsetWidth')
    } else {
      this.toggleMove('margin-left', 'offsetWidth')
    }
  }

  protected toggleMoveHidden (margin: MarginProperty, size: SizeProperty): void {
    if (this.immediate) {
      this.element.style.setProperty(margin, `-${this.element[size]}px`)
      this.backdrop?.style.setProperty('opacity', '0')
      this.finalize()
    } else {
      this.element.style.setProperty('transition-property', margin)
      this.backdrop?.style.setProperty('transition-property', 'opacity')

      window.requestAnimationFrame(() => {
        this.element.style.setProperty(margin, `-${this.element[size]}px`)
        this.backdrop?.style.setProperty('opacity', '0')
      })
    }
  }

  protected toggleMoveStart (): void {
    if (this.interactor.dir === 'ltr') {
      this.toggleMove('margin-left', 'offsetWidth')
    } else {
      this.toggleMove('margin-right', 'offsetWidth')
    }
  }

  protected toggleMoveTop (): void {
    this.toggleMove('margin-top', 'offsetHeight')
  }

  protected toggleMoveVisible (margin: MarginProperty, size?: SizeProperty): void {
    this.element.style.removeProperty('display')
    this.backdrop?.style.removeProperty('display')
    this.indexer.set(this.element, this.backdrop)

    if (
      !this.immediate &&
      size !== undefined
    ) {
      this.element.style.setProperty(margin, `-${this.element[size]}px`)
      this.backdrop?.style.setProperty('opacity', '0')
    }

    if (margin === 'margin-left') {
      this.element.style.removeProperty('margin-right')
    } else if (margin === 'margin-right') {
      this.element.style.removeProperty('margin-left')
    }

    window.requestAnimationFrame(() => {
      if (this.immediate) {
        this.element.style.setProperty('transition-property', 'none')
        this.backdrop?.style.setProperty('transition-property', 'none')
      } else {
        this.element.style.setProperty('transition-property', margin)
        this.backdrop?.style.setProperty('transition-property', 'opacity')
      }

      window.requestAnimationFrame(() => {
        this.element.style.setProperty(margin, '0px')
        this.backdrop?.style.setProperty('opacity', '1')

        if (this.immediate) {
          this.finalize()
        }
      })
    })
  }

  protected toggleOpacity (): void {
    if (this.element.hasAttribute('hidden')) {
      this.toggleOpacityHidden()
    } else {
      this.toggleOpacityVisible()
    }
  }

  protected toggleOpacityHidden (): void {
    if (this.immediate) {
      this.element.style.setProperty('opacity', '0')
      this.backdrop?.style.setProperty('opacity', '0')
      this.finalize()
    } else {
      this.element.style.setProperty('transition-property', 'opacity')
      this.backdrop?.style.setProperty('transition-property', 'opacity')

      window.requestAnimationFrame(() => {
        this.element.style.setProperty('opacity', '0')
        this.backdrop?.style.setProperty('opacity', '0')
      })
    }
  }

  protected toggleOpacityVisible (): void {
    this.element.style.removeProperty('display')
    this.element.style.setProperty('opacity', '0')
    this.backdrop?.style.removeProperty('display')
    this.backdrop?.style.setProperty('opacity', '0')
    this.indexer.set(this.element, this.backdrop)

    window.requestAnimationFrame(() => {
      if (this.immediate) {
        this.element.style.setProperty('transition-property', 'none')
        this.backdrop?.style.setProperty('transition-property', 'none')
      } else {
        this.element.style.setProperty('transition-property', 'opacity')
        this.backdrop?.style.setProperty('transition-property', 'opacity')
      }

      window.requestAnimationFrame(() => {
        this.element.style.setProperty('opacity', '1')
        this.backdrop?.style.setProperty('opacity', '1')

        if (this.immediate) {
          this.finalize()
        }
      })
    })
  }

  protected toggleScrollElement (event: InteractorEvent, scroll: boolean): void {
    if (scroll) {
      event.startScroll.element?.style.removeProperty('overflow')
    } else {
      event.startScroll.element?.style.setProperty('overflow', 'hidden')
    }
  }
}
