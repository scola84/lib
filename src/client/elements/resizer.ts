import type { ScolaElement } from './element'
import { ScolaInteract } from '../helpers/interact'
import type { ScolaInteractEvent } from '../helpers/interact'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'
import { absorb } from '../../common'

type Direction = 'down' | 'end' | 'start' | 'up'

interface Offset {
  height: number
  width: number
}

export class ScolaResizerElement extends HTMLDivElement implements ScolaElement {
  public contain: boolean

  public direction?: Direction[]

  public interact: ScolaInteract

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public snap: number

  public target: string

  public targetOffsets = new Map<HTMLElement, Offset>()

  public targetStyles = new Map<HTMLElement, string>()

  protected handleInteractBound = this.handleInteract.bind(this)

  protected handleMutationsBound = this.handleMutations.bind(this)

  public constructor () {
    super()
    this.interact = new ScolaInteract(this)
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-resizer', ScolaResizerElement, {
      extends: 'div'
    })
  }

  public connectedCallback (): void {
    this.observer.observe(this.handleMutationsBound, [
      'sc-maximized'
    ])

    this.interact.observe(this.handleInteractBound)
    this.interact.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
  }

  public disconnectedCallback (): void {
    this.interact.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
  }

  public getData (): Struct {
    return absorb(this.dataset)
  }

  public maximize (): void {
    this.targetStyles.clear()

    document
      .querySelectorAll<HTMLElement>(this.target)
      .forEach((element) => {
        this.targetStyles.set(element, element.getAttribute('style') ?? '')
        element.style.removeProperty('transform')
        element.style.setProperty('height', '100%')
        element.style.setProperty('left', '0px')
        element.style.setProperty('top', '0px')
        element.style.setProperty('width', '100%')
      })
  }

  public minimize (): void {
    document
      .querySelectorAll<HTMLElement>(this.target)
      .forEach((element) => {
        element.setAttribute('style', this.targetStyles.get(element) ?? '')
      })

    this.targetStyles.clear()
  }

  public reset (): void {
    this.contain = this.hasAttribute('sc-contain')

    this.direction = this.getAttribute('sc-direction')
      ?.trim()
      .split(/\s+/u) as Direction[]

    this.interact.mouse = this.interact.hasMouse
    this.interact.touch = this.interact.hasTouch
    this.snap = Number(this.getAttribute('sc-snap') ?? 1)
    this.target = this.getAttribute('sc-target') ?? ''
  }

  public setData (): void {}

  public update (): void {}

  protected calculateSize (size: number, distance: number): number {
    return Math.round((size + distance) / this.snap) * this.snap
  }

  protected handleInteract (event: ScolaInteractEvent): boolean {
    switch (event.type) {
      case 'end':
        return this.handleInteractEnd()
      case 'move':
        return this.handleInteractMove(event)
      case 'start':
        return this.handleInteractStart()
      default:
        return false
    }
  }

  protected handleInteractEnd (): boolean {
    this.toggleAttribute('sc-active', false)
    document.body.style.removeProperty('cursor')
    return true
  }

  protected handleInteractMove (event: ScolaInteractEvent): boolean {
    let handled = false

    if (this.shouldInteractMoveBottom()) {
      handled = this.handleInteractMoveBottom(event)
    } else if (this.shouldInteractMoveTop()) {
      handled = this.handleInteractMoveTop(event)
    }

    if (this.shouldInteractMoveLeft()) {
      handled = this.handleInteractMoveLeft(event)
    } else if (this.shouldInteractMoveRight()) {
      handled = this.handleInteractMoveRight(event)
    }

    return handled
  }

  protected handleInteractMoveBottom (event: ScolaInteractEvent): boolean {
    this.targetOffsets.forEach((offset, element) => {
      const {
        offsetTop: elementTop
      } = element

      const {
        height: parentHeight = 0
      } = element.offsetParent?.getBoundingClientRect() ?? {}

      const height = this.calculateSize(offset.height, event.distanceY)

      if (this.contain) {
        if ((elementTop + height) > parentHeight) {
          if (this.snap === 1) {
            element.style.setProperty('height', `${parentHeight - elementTop}px`)
          }
        } else {
          element.style.setProperty('height', `${height}px`)
        }
      } else {
        element.style.setProperty('height', `${height}px`)
      }
    })

    return true
  }

  protected handleInteractMoveLeft (event: ScolaInteractEvent): boolean {
    this.targetOffsets.forEach((offset, element) => {
      const position = window.getComputedStyle(element).getPropertyValue('position')

      const {
        offsetLeft: elementLeft,
        offsetWidth: elementWidth
      } = element

      const width = this.calculateSize(offset.width, -event.distanceX)

      if (this.contain) {
        if ((elementLeft - (width - elementWidth) < 0)) {
          if (this.snap === 1) {
            element.style.setProperty('width', `${elementWidth + elementLeft}px`)
          }
        } else {
          element.style.setProperty('width', `${width}px`)
        }
      } else {
        element.style.setProperty('width', `${width}px`)
      }

      const sizeDiff = element.offsetWidth - elementWidth

      if (
        sizeDiff !== 0 && (
          position === 'absolute' ||
          position === 'fixed'
        )
      ) {
        element.style.setProperty('left', `${element.offsetLeft - sizeDiff}px`)
      }
    })

    return true
  }

  protected handleInteractMoveRight (event: ScolaInteractEvent): boolean {
    this.targetOffsets.forEach((offset, element) => {
      const {
        offsetLeft: elementLeft
      } = element

      const {
        width: parentWidth = 0
      } = element.offsetParent?.getBoundingClientRect() ?? {}

      const width = this.calculateSize(offset.width, event.distanceX)

      if (this.contain) {
        if ((elementLeft + width) > parentWidth) {
          if (this.snap === 1) {
            element.style.setProperty('width', `${parentWidth - elementLeft}px`)
          }
        } else {
          element.style.setProperty('width', `${width}px`)
        }
      } else {
        element.style.setProperty('width', `${width}px`)
      }
    })

    return true
  }

  protected handleInteractMoveTop (event: ScolaInteractEvent): boolean {
    this.targetOffsets.forEach((offset, element) => {
      const position = window.getComputedStyle(element).getPropertyValue('position')

      const {
        offsetHeight: elementHeight,
        offsetTop: elementTop
      } = element

      const height = this.calculateSize(offset.height, -event.distanceY)

      if (this.contain) {
        if ((elementTop - (height - elementHeight) < 0)) {
          if (this.snap === 1) {
            element.style.setProperty('height', `${elementHeight + elementTop}px`)
          }
        } else {
          element.style.setProperty('height', `${height}px`)
        }
      } else {
        element.style.setProperty('height', `${height}px`)
      }

      const sizeDiff = element.offsetHeight - elementHeight

      if (
        sizeDiff !== 0 && (
          position === 'absolute' ||
          position === 'fixed'
        )
      ) {
        element.style.setProperty('top', `${element.offsetTop - sizeDiff}px`)
      }
    })

    return true
  }

  protected handleInteractStart (): boolean {
    this.propagator.dispatch('beforeresize', [this.getData()])
    this.targetOffsets.clear()

    document
      .querySelectorAll<HTMLElement>(this.target)
      .forEach((element) => {
        this.targetOffsets.set(element, {
          height: element.offsetHeight,
          width: element.offsetWidth
        })
      })

    this.toggleAttribute('sc-active', true)
    document.body.style.setProperty('cursor', window.getComputedStyle(this).getPropertyValue('cursor'))
    return true
  }

  protected handleMutations (mutations: MutationRecord[]): void {
    const attributes = this.observer.normalize(mutations)

    if (attributes.includes('sc-maximized')) {
      if (this.hasAttribute('sc-maximized')) {
        this.maximize()
      } else {
        this.minimize()
      }
    }
  }

  protected shouldInteractMoveBottom (): boolean {
    return this.direction?.includes('down') === true
  }

  protected shouldInteractMoveLeft (): boolean {
    return (
      this.direction?.includes('start') === true &&
      this.interact.dir === 'ltr'
    ) || (
      this.direction?.includes('end') === true &&
      this.interact.dir === 'rtl'
    )
  }

  protected shouldInteractMoveRight (): boolean {
    return (
      this.direction?.includes('end') === true &&
      this.interact.dir === 'ltr'
    ) || (
      this.direction?.includes('start') === true &&
      this.interact.dir === 'rtl'
    )
  }

  protected shouldInteractMoveTop (): boolean {
    return this.direction?.includes('up') === true
  }
}
