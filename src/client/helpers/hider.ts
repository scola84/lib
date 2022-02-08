import { ScolaBreakpoint } from './breakpoint'
import type { ScolaBreakpointEvent } from './breakpoint'
import type { ScolaElement } from '../elements/element'
import { ScolaIndexer } from './indexer'
import { ScolaInteract } from './interact'
import type { ScolaInteractEvent } from './interact'

declare global {
  interface HTMLElementEventMap {
    'sc-hide-modal': CustomEvent
  }
}

type Direction = 'down' | 'end' | 'start' | 'up'

type MarginProperty = 'margin-bottom' | 'margin-left' | 'margin-right' | 'margin-top'

type Mode = 'center' | 'height' | 'move-bottom' | 'move-end' | 'move-start' | 'move-top' | 'opacity'

type SizeProperty = 'offsetHeight' | 'offsetWidth'

export class ScolaHider {
  public static distanceThreshold = 0.1

  public static selector = '[is^="sc-"]'

  public activeElement?: HTMLElement

  public backdrop: HTMLElement | null

  public breakpoint: ScolaBreakpoint

  public direction?: Direction[]

  public distanceThreshold: number

  public element: ScolaElement

  public immediate = true

  public indexer: ScolaIndexer

  public interact: ScolaInteract

  public mode: Mode

  protected handleBreakpointBound = this.handleBreakpoint.bind(this)

  protected handleHideModalBound = this.handleHideModal.bind(this)

  protected handleInteractBound = this.handleInteract.bind(this)

  protected handleTransitionendBound = this.handleTransitionend.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
    this.backdrop = this.selectBackdrop()
    this.breakpoint = new ScolaBreakpoint(element)
    this.indexer = new ScolaIndexer()
    this.interact = new ScolaInteract(element)

    if (this.breakpoint.parse('sc-hide-initial') === '') {
      this.element.toggleAttribute('hidden', true)
    }

    this.reset()
    this.toggle()
  }

  public connect (): void {
    this.breakpoint.observe(this.handleBreakpointBound)
    this.interact.observe(this.handleInteractBound)
    this.breakpoint.connect()
    this.interact.connect()
    this.addEventListeners()
  }

  public disconnect (): void {
    this.breakpoint.disconnect()
    this.interact.disconnect()
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
    this.direction = this.breakpoint.parse('sc-hide-direction')
      ?.trim()
      .split(/\s+/u) as Direction[]

    this.indexer.index = this.element.getAttribute('sc-hide-index')
    this.interact.cancel = true
    this.interact.edgeThreshold = Number(this.breakpoint.parse('sc-hide-interact-edge-threshold') ?? ScolaInteract.edgeThreshold)
    this.interact.keyboard = this.breakpoint.parse('sc-hide-interact-keyboard') === ''
    this.interact.mouse = this.breakpoint.parse('sc-hide-interact-mouse') === ''
    this.interact.target = 'window'
    this.interact.touch = this.breakpoint.parse('sc-hide-interact-touch') === ''
    this.mode = (this.breakpoint.parse('sc-hide-mode') as Mode | null) ?? 'center'
    this.distanceThreshold = Number(this.breakpoint.parse('sc-hide-distance-threshold') ?? ScolaHider.distanceThreshold)
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
        this.toggleBottom()
        break
      case 'move-end':
        this.toggleEnd()
        break
      case 'move-start':
        this.toggleStart()
        break
      case 'move-top':
        this.toggleTop()
        break
      case 'opacity':
        this.toggleOpacity()
        break
      default:
        this.element.removeAttribute('hidden')
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
      const element = this.element.querySelector('[sc-focus]')

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
    this.immediate = false
    this.element.style.removeProperty('transition-timing-function')

    if (this.element.hasAttribute('hidden')) {
      this.element.style.setProperty('display', 'none', 'important')
      this.backdrop?.style.setProperty('display', 'none', 'important')
      this.indexer.remove(this.element, this.backdrop)
      this.element.propagator.dispatch('hide', [this.element.getData()])
    } else {
      this.element.propagator.dispatch('show', [this.element.getData()])
    }

    this.changeFocus()
  }

  protected handleBreakpoint (event: ScolaBreakpointEvent): void {
    if (event.changed) {
      this.interact.disconnect()
      this.reset()
      this.interact.connect()
    }

    if (!this.element.hasAttribute('hidden')) {
      this.immediate = true
      this.toggle()
    }
  }

  protected handleHideModal (): void {
    this.hideModal()
  }

  protected handleInteract (event: ScolaInteractEvent): boolean {
    switch (event.type) {
      case 'end':
        return this.handleInteractEnd(event)
      case 'move':
        return this.handleInteractMove(event)
      case 'start':
        return this.handleInteractStart(event)
      default:
        return false
    }
  }

  protected handleInteractEnd (event: ScolaInteractEvent): boolean {
    let handled = false

    if (this.mode.startsWith('move-')) {
      if (this.shouldInteractMoveBottom(event)) {
        handled = this.handleInteractEndMoveBottom(event)
      } else if (this.shouldInteractMoveLeft(event)) {
        handled = this.handleInteractEndMoveLeft(event)
      } else if (this.shouldInteractMoveRight(event)) {
        handled = this.handleInteractEndMoveRight(event)
      } else if (this.shouldInteractMoveTop(event)) {
        handled = this.handleInteractEndMoveTop(event)
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

  protected handleInteractEndMoveBottom (event: ScolaInteractEvent): boolean {
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
        this.toggleMarginHidden('margin-bottom', 'offsetHeight')
      }
    } else if (
      event.distanceY > (this.element.offsetHeight * this.distanceThreshold) &&
      this.direction?.includes('down') !== false
    ) {
      this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
    } else {
      this.immediate = this.isVisibleByMargin(window.getComputedStyle(this.element).getPropertyValue('margin-bottom'))
      this.toggleMarginVisible('margin-bottom')
    }

    return true
  }

  protected handleInteractEndMoveLeft (event: ScolaInteractEvent): boolean {
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
        this.toggleMarginHidden('margin-left', 'offsetWidth')
      }
    } else if (
      event.distanceX < (-this.element.offsetWidth * this.distanceThreshold) &&
      this.direction?.includes(this.resolveDirection('start')) !== false
    ) {
      this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
    } else {
      this.immediate = this.isVisibleByMargin(window.getComputedStyle(this.element).getPropertyValue('margin-left'))
      this.toggleMarginVisible('margin-left')
    }

    return true
  }

  protected handleInteractEndMoveRight (event: ScolaInteractEvent): boolean {
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
        this.toggleMarginHidden('margin-right', 'offsetWidth')
      }
    } else if (
      event.distanceX > (this.element.offsetWidth * this.distanceThreshold) &&
      this.direction?.includes(this.resolveDirection('end')) !== false
    ) {
      this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
    } else {
      this.immediate = this.isVisibleByMargin(window.getComputedStyle(this.element).getPropertyValue('margin-right'))
      this.toggleMarginVisible('margin-right')
    }

    return true
  }

  protected handleInteractEndMoveTop (event: ScolaInteractEvent): boolean {
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
        this.toggleMarginHidden('margin-top', 'offsetHeight')
      }
    } else if (
      event.distanceY < (-this.element.offsetHeight * this.distanceThreshold) &&
      this.direction?.includes('up') !== false
    ) {
      this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
    } else {
      this.immediate = this.isVisibleByMargin(window.getComputedStyle(this.element).getPropertyValue('margin-top'))
      this.toggleMarginVisible('margin-top')
    }

    return true
  }

  protected handleInteractMove (event: ScolaInteractEvent): boolean {
    if (this.shouldInteractMoveBottom(event)) {
      return this.handleInteractMoveBottom(event)
    } else if (this.shouldInteractMoveLeft(event)) {
      return this.handleInteractMoveLeft(event)
    } else if (this.shouldInteractMoveRight(event)) {
      return this.handleInteractMoveRight(event)
    } else if (this.shouldInteractMoveTop(event)) {
      return this.handleInteractMoveTop(event)
    }

    return false
  }

  protected handleInteractMoveBottom (event: ScolaInteractEvent): boolean {
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

  protected handleInteractMoveLeft (event: ScolaInteractEvent): boolean {
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

  protected handleInteractMoveRight (event: ScolaInteractEvent): boolean {
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

  protected handleInteractMoveTop (event: ScolaInteractEvent): boolean {
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

  protected handleInteractStart (event: ScolaInteractEvent): boolean {
    let handled = false

    if (this.interact.isKeyboard(event.originalEvent)) {
      if (this.interact.isKey(event.originalEvent, 'Escape')) {
        this.hideModal()
      }
    } else if (this.mode.startsWith('move-')) {
      if (this.shouldInteractMove(event)) {
        if (this.shouldInteractMoveBottom(event)) {
          handled = this.handleInteractStartMoveBottom()
        } else if (this.shouldInteractMoveLeft(event)) {
          handled = this.handleInteractStartMoveLeft()
        } else if (this.shouldInteractMoveRight(event)) {
          handled = this.handleInteractStartMoveRight()
        } else if (this.shouldInteractMoveTop(event)) {
          handled = this.handleInteractStartMoveTop()
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

  protected handleInteractStartMoveBottom (): boolean {
    window.requestAnimationFrame(() => {
      if (this.element.hasAttribute('hidden')) {
        this.element.style.setProperty('margin-bottom', `-${this.element.offsetHeight}px`)
      }
    })

    return true
  }

  protected handleInteractStartMoveLeft (): boolean {
    window.requestAnimationFrame(() => {
      if (this.element.hasAttribute('hidden')) {
        this.element.style.setProperty('margin-left', `-${this.element.offsetWidth}px`)
      }
    })

    return true
  }

  protected handleInteractStartMoveRight (): boolean {
    window.requestAnimationFrame(() => {
      if (this.element.hasAttribute('hidden')) {
        this.element.style.setProperty('margin-right', `-${this.element.offsetWidth}px`)
      }
    })

    return true
  }

  protected handleInteractStartMoveTop (): boolean {
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
      this.interact.dir === 'rtl'
    ) {
      return 'start'
    } else if (
      direction === 'start' &&
      this.interact.dir === 'rtl'
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
    this.element.style.setProperty('transition-timing-function', this.interact.getTimingFunction(velocity))
  }

  protected shouldInteractMove (event: ScolaInteractEvent): boolean {
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

      if (
        !path.includes(this.element) && (
          this.backdrop === null ||
          !path.includes(this.backdrop)
        )
      ) {
        return false
      }
    }

    return true
  }

  protected shouldInteractMoveBottom (event: ScolaInteractEvent): boolean {
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

  protected shouldInteractMoveLeft (event: ScolaInteractEvent): boolean {
    if ((
      this.mode === 'move-start' &&
      this.interact.dir === 'ltr'
    ) || (
      this.mode === 'move-end' &&
      this.interact.dir === 'rtl'
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

  protected shouldInteractMoveRight (event: ScolaInteractEvent): boolean {
    if ((
      this.mode === 'move-end' &&
      this.interact.dir === 'ltr'
    ) || (
      this.mode === 'move-start' &&
      this.interact.dir === 'rtl'
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

  protected shouldInteractMoveTop (event: ScolaInteractEvent): boolean {
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

  protected toggleBottom (): void {
    this.toggleMargin('margin-bottom', 'offsetHeight')
  }

  protected toggleCenter (): void {
    if (this.element.hasAttribute('hidden')) {
      this.toggleCenterHidden()
    } else {
      this.toggleCenterVisible()
    }
  }

  protected toggleCenterHidden (): void {
    this.element.propagator.dispatch('beforehide', [this.element.getData()])

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
    this.element.propagator.dispatch('beforeshow', [this.element.getData()])
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

  protected toggleEnd (): void {
    if (this.interact.dir === 'rtl') {
      this.toggleMargin('margin-left', 'offsetWidth')
    } else {
      this.toggleMargin('margin-right', 'offsetWidth')
    }
  }

  protected toggleHeight (): void {
    if (this.element.hasAttribute('hidden')) {
      this.toggleHeightHidden()
    } else {
      this.toggleHeightVisible()
    }
  }

  protected toggleHeightHidden (): void {
    this.element.propagator.dispatch('beforehide', [this.element.getData()])

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
    this.element.propagator.dispatch('beforeshow', [this.element.getData()])
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

  protected toggleMargin (margin: MarginProperty, size: SizeProperty): void {
    if (this.element.hasAttribute('hidden')) {
      this.toggleMarginHidden(margin, size)
    } else {
      this.toggleMarginVisible(margin, size)
    }
  }

  protected toggleMarginHidden (margin: MarginProperty, size: SizeProperty): void {
    this.element.propagator.dispatch('beforehide', [this.element.getData()])

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

  protected toggleMarginVisible (margin: MarginProperty, size?: SizeProperty): void {
    this.element.propagator.dispatch('beforeshow', [this.element.getData()])
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
    this.element.propagator.dispatch('beforehide', [this.element.getData()])

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
    this.element.propagator.dispatch('beforeshow', [this.element.getData()])
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

  protected toggleScrollElement (event: ScolaInteractEvent, scroll: boolean): void {
    if (scroll) {
      event.startScroll.element?.style.removeProperty('overflow')
    } else {
      event.startScroll.element?.style.setProperty('overflow', 'hidden')
    }
  }

  protected toggleStart (): void {
    if (this.interact.dir === 'rtl') {
      this.toggleMargin('margin-right', 'offsetWidth')
    } else {
      this.toggleMargin('margin-left', 'offsetWidth')
    }
  }

  protected toggleTop (): void {
    this.toggleMargin('margin-top', 'offsetHeight')
  }
}
