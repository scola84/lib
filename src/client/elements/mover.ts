import type { ScolaElement } from './element'
import { ScolaInteract } from '../helpers/interact'
import type { ScolaInteractEvent } from '../helpers/interact'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'
import { absorb } from '../../common'

interface Offset {
  left: number
  top: number
}

export class ScolaMoverElement extends HTMLDivElement implements ScolaElement {
  public contain: boolean

  public interact: ScolaInteract

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public snap: number

  public target: string

  public targetOffsets = new Map<HTMLElement, Offset>()

  protected handleInteractBound = this.handleInteract.bind(this)

  public constructor () {
    super()
    this.interact = new ScolaInteract(this)
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-mover', ScolaMoverElement, {
      extends: 'div'
    })
  }

  public connectedCallback (): void {
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

  public reset (): void {
    this.contain = this.hasAttribute('sc-contain')
    this.interact.mouse = this.interact.hasMouse
    this.interact.touch = this.interact.hasTouch
    this.snap = Number(this.getAttribute('sc-snap') ?? 1)
    this.target = this.getAttribute('sc-target') ?? ''
  }

  public setData (): void {}

  public update (): void {}

  protected calculatePosition (position: number, distance: number): number {
    return Math.round((position + distance) / this.snap) * this.snap
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
    this.targetOffsets.forEach((offset, element) => {
      const {
        height: elementHeight,
        width: elementWidth
      } = element.getBoundingClientRect()

      const {
        height: parentHeight = 0,
        width: parentWidth = 0
      } = element.offsetParent?.getBoundingClientRect() ?? {}

      const left = this.calculatePosition(offset.left, event.distanceX)
      const top = this.calculatePosition(offset.top, event.distanceY)

      if (this.contain) {
        if (left < 0) {
          if (this.snap === 1) {
            element.style.setProperty('left', '0px')
          }
        } else if ((left + elementWidth) > parentWidth) {
          if (this.snap === 1) {
            element.style.setProperty('left', `${parentWidth - elementWidth}px`)
          }
        } else {
          element.style.setProperty('left', `${left}px`)
        }

        if (top < 0) {
          if (this.snap === 1) {
            element.style.setProperty('top', '0px')
          }
        } else if ((top + elementHeight) > parentHeight) {
          if (this.snap === 1) {
            element.style.setProperty('top', `${parentHeight - elementHeight}px`)
          }
        } else {
          element.style.setProperty('top', `${top}px`)
        }
      } else {
        element.style.setProperty('left', `${left}px`)
        element.style.setProperty('top', `${top}px`)
      }
    })

    return true
  }

  protected handleInteractStart (): boolean {
    this.propagator.dispatch('beforemove', [this.getData()])
    this.targetOffsets.clear()

    document
      .querySelectorAll<HTMLElement>(this.target)
      .forEach((element) => {
        this.targetOffsets.set(element, {
          left: element.offsetLeft,
          top: element.offsetTop
        })
      })

    this.toggleAttribute('sc-active', true)
    document.body.style.setProperty('cursor', window.getComputedStyle(this).getPropertyValue('cursor'))
    return true
  }
}
