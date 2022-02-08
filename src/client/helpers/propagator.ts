import type { ScolaElement } from '../elements/element'
import { ScolaEvent } from './event'
import { ScolaInteract } from './interact'
import type { ScolaInteractEvent } from './interact'
import { isStruct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-data-set': CustomEvent
  }
}

export class ScolaPropagator {
  public static selector = ':scope > [is^="sc-"]:not([sc-nodata])'

  public cancel: boolean

  public element: ScolaElement

  public interact: ScolaInteract

  public keydown: string[][]

  protected handleInteractBound = this.handleInteract.bind(this)

  protected handleSetBound = this.handleSet.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
    this.interact = new ScolaInteract(element)
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

  public dispatch (on: string, data: unknown[], trigger?: Event): boolean {
    let dispatched = false

    this.element
      .getAttribute(`sc-on${on}`)
      ?.trim()
      .split(/\s+/u)
      .forEach((event) => {
        dispatched = true
        this.dispatchEvent(event, data, trigger)
      })

    return dispatched
  }

  public dispatchEvent (event: string, data: unknown[], trigger?: Event): void {
    const [
      name = '',
      selector = ''
    ] = event.split('@')

    if (name !== '') {
      let targets: HTMLElement[] | NodeList = []

      if (selector === '') {
        targets = [this.element]
      } else if (selector === 'console') {
        // eslint-disable-next-line no-console
        console.log(data)
      } else {
        targets = document.querySelectorAll(selector)
      }

      data.forEach((datum) => {
        targets.forEach((target) => {
          window.requestAnimationFrame(() => {
            target.dispatchEvent(new ScolaEvent(name, {
              bubbles: target === this.element,
              detail: datum,
              element: this.element,
              trigger
            }))
          })
        })
      })
    }
  }

  public reset (): void {
    this.interact.cancel = this.element.hasAttribute('sc-cancel')
    this.interact.keyboard = this.interact.hasKeyboard
    this.keydown = this.parseKeydown()
  }

  public set (data: unknown): void {
    this.element
      .querySelectorAll<ScolaElement>(ScolaPropagator.selector)
      .forEach((target) => {
        const name = (
          target.getAttribute('sc-data-name') ??
          target.getAttribute('name') ??
          ''
        )

        if (
          isStruct(data) &&
          data[name] !== undefined
        ) {
          target.setData(data[name])
        } else {
          target.setData(data)
        }
      })
  }

  protected addEventListeners (): void {
    this.element.addEventListener('sc-data-set', this.handleSetBound)
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

    this.keydown.forEach(([binding, boundEvent]) => {
      if (this.isBound(binding, event)) {
        handled = true
        this.dispatchEvent(boundEvent, [this.element.getData()], event)
      }
    })

    return handled
  }

  protected handleSet (event: CustomEvent): void {
    this.element.setData(event.detail)
  }

  protected isBound (binding: string, event: KeyboardEvent): boolean {
    return binding
      .split('+')
      .every((key) => {
        if (
          key === 'alt' &&
          event.altKey
        ) {
          return true
        } else if (
          key === 'arrowend' &&
          this.interact.isArrowEnd(event)
        ) {
          return true
        } else if (
          key === 'arrowstart' &&
          this.interact.isArrowStart(event)
        ) {
          return true
        } else if (
          key === 'ctrl' &&
          event.ctrlKey
        ) {
          return true
        } else if (
          key === 'shift' &&
          event.shiftKey
        ) {
          return true
        } else if (
          event.key.toLowerCase() === key ||
          event.code.toLowerCase() === key
        ) {
          return true
        }

        return false
      })
  }

  protected parseKeydown (): string[][] {
    return this.element
      .getAttribute('sc-onkeydown')
      ?.trim()
      .split(/\s+/u)
      .map((event) => {
        return ((/^(?<type>[^:]+):(?<event>.*)$/u).exec(event))?.slice(1) ?? []
      }) ?? []
  }

  protected removeEventListeners (): void {
    this.element.removeEventListener('sc-data-set', this.handleSetBound)
  }
}
