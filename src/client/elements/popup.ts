import { absorb, isStruct } from '../../common'
import { ScolaBreakpoint } from '../helpers/breakpoint'
import type { ScolaElement } from './element'
import type { ScolaEvent } from '../helpers/event'
import { ScolaIndexer } from '../helpers/indexer'
import { ScolaInteract } from '../helpers/interact'
import type { ScolaInteractEvent } from '../helpers/interact'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-popup-hide': ScolaEvent
    'sc-popup-show': ScolaEvent
  }
}

interface Position {
  left: string
  top: string
}

interface Style {
  left: number
  top: number
}

const leftAlternatives: Struct<string[]> = {
  'center': ['center', 'start', 'end', 'screen-center'],
  'end': ['end', 'start', 'center', 'screen-center'],
  'end-at-start': ['end-at-start', 'start-at-end', 'screen-center'],
  'screen-center': ['screen-center'],
  'start': ['start', 'end', 'center', 'screen-center'],
  'start-at-end': ['start-at-end', 'end-at-start', 'screen-center']
}

const topAlternatives: Struct<string[]> = {
  'bottom': ['bottom', 'top', 'center', 'screen-center'],
  'bottom-at-top': ['bottom-at-top', 'top-at-bottom', 'screen-center'],
  'center': ['center', 'top', 'bottom', 'screen-center'],
  'screen-center': ['screen-center'],
  'top': ['top', 'bottom', 'center', 'screen-center'],
  'top-at-bottom': ['top-at-bottom', 'bottom-at-top', 'screen-center']
}

export class ScolaPopupElement extends HTMLDivElement implements ScolaElement {
  public anchor?: HTMLElement

  public breakpoint: ScolaBreakpoint

  public datamap: Struct = {}

  public immediate = true

  public indexer: ScolaIndexer

  public interact: ScolaInteract

  public left: string

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public top: string

  public trigger?: MouseEvent

  protected handleBreakpointBound = this.handleBreakpoint.bind(this)

  protected handleHideBound = this.handleHide.bind(this)

  protected handleInteractBound = this.handleInteract.bind(this)

  protected handleMutationsBound = this.handleMutations.bind(this)

  protected handleShowBound = this.handleShow.bind(this)

  protected handleTransitionendBound = this.handleTransitionend.bind(this)

  public constructor () {
    super()
    this.breakpoint = new ScolaBreakpoint(this)
    this.indexer = new ScolaIndexer()
    this.interact = new ScolaInteract(this)
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.reset()
    this.toggle()
  }

  public static define (): void {
    customElements.define('sc-popup', ScolaPopupElement, {
      extends: 'div'
    })
  }

  public connectedCallback (): void {
    this.breakpoint.observe(this.handleBreakpointBound)
    this.interact.observe(this.handleInteractBound)

    this.observer.observe(this.handleMutationsBound, [
      'hidden'
    ])

    this.breakpoint.connect()
    this.interact.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()
  }

  public disconnectedCallback (): void {
    if (this.hasAttribute('hidden')) {
      this.finalize()
    }

    this.breakpoint.disconnect()
    this.interact.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public getData (): Struct {
    return absorb(this.dataset, this.datamap, true)
  }

  public hide (): void {
    this.propagator.dispatch('beforehide', [this.getData()])

    if (this.immediate) {
      this.style.setProperty('opacity', '0')
      this.style.setProperty('transition-property', 'none')
      this.finalize()
    } else {
      this.style.setProperty('opacity', '1')
      this.style.setProperty('transition-property', 'opacity')

      window.requestAnimationFrame(() => {
        this.style.setProperty('opacity', '0')
      })
    }
  }

  public reset (): void {
    this.interact.keyboard = this.interact.hasKeyboard
    this.interact.mouse = this.interact.hasMouse
    this.interact.target = 'window'
    this.interact.touch = this.interact.hasTouch
    this.left = this.breakpoint.parse('sc-left') ?? 'center'
    this.top = this.breakpoint.parse('sc-top') ?? 'center'
  }

  public setData (data: unknown): void {
    if (isStruct(data)) {
      Object.assign(this.datamap, data)
    }

    this.propagator.set(data)
  }

  public show (): void {
    this.propagator.dispatch('beforeshow', [this.getData()])
    this.style.removeProperty('display')
    this.style.setProperty('opacity', '0')
    this.indexer.set(this)

    const position = {
      left: this.left,
      top: this.top
    }

    let style = {
      left: 0,
      top: 0
    }

    if (this.trigger === undefined) {
      style = this.calculateStyle(position)
    } else {
      style.left = this.trigger.clientX
      style.top = this.trigger.clientY
    }

    this.setAttribute('sc-left-calc', position.left)
    this.setAttribute('sc-top-calc', position.top)
    this.style.setProperty('left', `${style.left}px`)
    this.style.setProperty('top', `${style.top}px`)

    if (this.immediate) {
      this.style.setProperty('transition-property', 'none')
    } else {
      this.style.setProperty('transition-property', 'opacity')
    }

    window.requestAnimationFrame(() => {
      this.style.setProperty('opacity', '1')

      if (this.immediate) {
        this.finalize()
      }
    })
  }

  public toggle (): void {
    if (this.hasAttribute('hidden')) {
      this.hide()
    } else {
      this.show()
    }
  }

  public update (): void {}

  protected addEventListeners (): void {
    this.addEventListener('sc-popup-hide', this.handleHideBound)
    this.addEventListener('sc-popup-show', this.handleShowBound)
    this.addEventListener('transitionend', this.handleTransitionendBound)
  }

  protected calculateAlternativeStyle (position: Position): Style {
    return {
      left: this.calculateAlternativeStyleLeft(position),
      top: this.calculateAlternativeStyleTop(position)
    }
  }

  protected calculateAlternativeStyleLeft (position: Position): number {
    const {
      offsetLeft = 0,
      offsetWidth = 0
    } = this.anchor ?? {}

    let left = offsetLeft

    switch (`${position.left}-${this.interact.dir}`) {
      case 'center-ltr':
      case 'center-rtl':
        left += -(this.offsetWidth - offsetWidth) / 2
        break
      case 'end-rtl':
      case 'start-ltr':
        left += 0
        break
      case 'end-ltr':
      case 'start-rtl':
        left += -this.offsetWidth + offsetWidth
        break
      case 'end-at-start-rtl':
      case 'start-at-end-ltr':
        left += offsetWidth
        break
      case 'end-at-start-ltr':
      case 'start-at-end-rtl':
        left += -this.offsetWidth
        break
      case 'screen-center-ltr':
      case 'screen-center-rtl':
        left = (window.innerWidth - this.offsetWidth) / 2
        break
      default:
        break
    }

    return left
  }

  protected calculateAlternativeStyleTop (position: Position): number {
    const {
      offsetHeight = 0,
      offsetTop = 0
    } = this.anchor ?? {}

    let top = offsetTop + offsetHeight

    switch (position.top) {
      case 'bottom':
        top += -this.offsetHeight
        break
      case 'bottom-at-top':
        top += -this.offsetHeight - offsetHeight
        break
      case 'center':
        top += -(this.offsetHeight + offsetHeight) / 2
        break
      case 'screen-center':
        top = (window.innerHeight - this.offsetHeight) / 2
        break
      case 'top':
        top += -offsetHeight
        break
      case 'top-at-bottom':
        break
      default:
        break
    }

    return top
  }

  protected calculateStyle (position: Position): Style {
    let style = {
      left: 0,
      top: 0
    }

    leftAlternatives[this.left].some((alternative: string): boolean => {
      position.left = alternative
      style = this.calculateAlternativeStyle(position)
      return (
        style.left >= 0 &&
        (style.left + this.offsetWidth) <= window.innerWidth
      )
    })

    topAlternatives[this.top].some((alternative: string): boolean => {
      position.top = alternative
      style = this.calculateAlternativeStyle(position)
      return (
        style.top >= 0 &&
        (style.top + this.offsetHeight) <= window.innerHeight
      )
    })

    return style
  }

  protected finalize (): void {
    this.immediate = false

    if (this.hasAttribute('hidden')) {
      this.style.setProperty('display', 'none', 'important')
      this.indexer.remove(this)
      this.propagator.dispatch('hide', [this.getData()])
    } else {
      this.propagator.dispatch('show', [this.getData()])
    }
  }

  protected handleBreakpoint (): void {
    this.reset()

    if (!this.hasAttribute('hidden')) {
      this.show()
    }
  }

  protected handleHide (): void {
    this.toggleAttribute('hidden', true)
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
      !this.hasAttribute('hidden') && (
        this.interact.isKey(event.originalEvent, 'Escape') ||
        !event.originalEvent.composedPath().includes(this)
      )
    ) {
      this.toggleAttribute('hidden', true)
    }

    return false
  }

  protected handleMutations (): void {
    this.toggle()
  }

  protected handleShow (event: ScolaEvent): void {
    if (event.element.hasAttribute('sc-popup-anchor')) {
      this.anchor = event.element
      this.trigger = undefined
    } else if (event.trigger instanceof MouseEvent) {
      this.trigger = event.trigger
    }

    if (this.hasAttribute('hidden')) {
      this.toggleAttribute('hidden', false)
    } else {
      this.show()
    }
  }

  protected handleTouchstart (event: TouchEvent): void {
    if (!event.composedPath().includes(this)) {
      this.toggleAttribute('hidden', true)
    }
  }

  protected handleTransitionend (event: TransitionEvent): void {
    if (event.target === this) {
      this.finalize()
    }
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-popup-hide', this.handleHideBound)
    this.removeEventListener('sc-popup-show', this.handleShowBound)
    this.removeEventListener('transitionend', this.handleTransitionendBound)
  }
}
