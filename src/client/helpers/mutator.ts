import { cast, isPrimitive, isStruct, rejoin } from '../../common'
import { Sanitizer } from './sanitizer'
import type { ScolaElement } from '../elements'
import type { Struct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-attrs-rotate': CustomEvent
    'sc-attrs-set': CustomEvent
    'sc-attrs-toggle': CustomEvent
    'sc-attrs-unset': CustomEvent
  }
}

export class Mutator {
  public static presets: Struct<Struct | undefined> = {}

  public element: ScolaElement

  public sanitizer: Sanitizer

  protected handleRotateAttributesBound = this.handleRotateAttributes.bind(this)

  protected handleSetAttributesBound = this.handleSetAttributes.bind(this)

  protected handleToggleAttributesBound = this.handleToggleAttributes.bind(this)

  protected handleUnsetAttributesBound = this.handleUnsetAttributes.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
    this.sanitizer = new Sanitizer()
    this.preset()
  }

  public static definePresets (observers: Struct<Struct>): void {
    Object
      .entries(observers)
      .forEach(([name, preset]) => {
        Mutator.presets[name] = preset
      })
  }

  public connect (): void {
    this.addEventListeners()
  }

  public disconnect (): void {
    this.removeEventListeners()
  }

  public preset (): void {
    this.element
      .getAttribute('sc-preset')
      ?.split(' ')
      .forEach((name) => {
        this.setAttributes(Mutator.presets[name], false)
      })
  }

  public rotateAttributes (data: unknown): void {
    if (isStruct(data)) {
      Object
        .entries(data)
        .map(([name, value]) => {
          return [rejoin(name, '-'), value]
        })
        .forEach(([name, value]) => {
          const attrName = String(name)

          const attrValues = String(value)
            .trim()
            .split(/\s+/u)

          const index = attrValues.findIndex((attrValue) => {
            return this.element.getAttribute(attrName)?.includes(attrValue)
          })

          const attrValue = attrValues[index + 1] ?? attrValues[0]

          if (this.sanitizer.checkAttribute(this.element.nodeName, attrName, attrValue)) {
            this.element.setAttribute(attrName, attrValue)
          }
        })
    }
  }

  public selectTemplates (): Map<string, HTMLTemplateElement> {
    const map = new Map<string, HTMLTemplateElement>()

    this.element
      .querySelectorAll('template')
      .forEach((template) => {
        map.set(template.getAttribute('sc-name') ?? '', template)
      })

    return map
  }

  public setAttributes (data: unknown, overwrite = true): void {
    if (isStruct(data)) {
      Object
        .entries(data)
        .map(([name, value]) => {
          return [rejoin(name, '-'), value]
        })
        .forEach(([name, value]) => {
          const attrName = String(name)

          if (
            overwrite ||
            !this.element.hasAttribute(attrName)
          ) {
            const castValue = cast(value)

            if (castValue === false) {
              this.element.removeAttribute(attrName)
            } else if (castValue === true) {
              this.element.setAttribute(attrName, '')
            } else if (isPrimitive(castValue)) {
              const attrValue = castValue.toString()

              if (this.sanitizer.checkAttribute(this.element.nodeName, attrName, attrValue)) {
                this.element.setAttribute(attrName, attrValue)
              }
            }
          }
        })
    }
  }

  public toggleAttributes (data: unknown): void {
    if (isStruct(data)) {
      Object
        .entries(data)
        .map(([name, value]) => {
          return [rejoin(name, '-'), value]
        })
        .forEach(([name, value]) => {
          const attrName = String(name)
          const castValue = cast(value)

          if (typeof castValue === 'boolean') {
            this.element.toggleAttribute(attrName)
          } else if (value === this.element.getAttribute(attrName)) {
            this.element.removeAttribute(attrName)
          } else if (isPrimitive(castValue)) {
            const attrValue = castValue.toString()

            if (this.sanitizer.checkAttribute(this.element.nodeName, attrName, attrValue)) {
              this.element.setAttribute(attrName, attrValue)
            }
          }
        })
    }
  }

  public unsetAttributes (data: unknown): void {
    if (isStruct(data)) {
      Object
        .entries(data)
        .map(([name, value]) => {
          return [rejoin(name, '-'), value]
        })
        .forEach(([name]) => {
          this.element.removeAttribute(String(name))
        })
    }
  }

  protected addEventListeners (): void {
    this.element.addEventListener('sc-attrs-rotate', this.handleRotateAttributesBound)
    this.element.addEventListener('sc-attrs-set', this.handleSetAttributesBound)
    this.element.addEventListener('sc-attrs-toggle', this.handleToggleAttributesBound)
    this.element.addEventListener('sc-attrs-unset', this.handleUnsetAttributesBound)
  }

  protected handleRotateAttributes (event: CustomEvent): void {
    this.rotateAttributes(event.detail)
  }

  protected handleSetAttributes (event: CustomEvent): void {
    this.setAttributes(event.detail)
  }

  protected handleToggleAttributes (event: CustomEvent): void {
    this.toggleAttributes(event.detail)
  }

  protected handleUnsetAttributes (event: CustomEvent): void {
    this.unsetAttributes(event.detail)
  }

  protected removeEventListeners (): void {
    this.element.removeEventListener('sc-attrs-rotate', this.handleRotateAttributesBound)
    this.element.removeEventListener('sc-attrs-set', this.handleSetAttributesBound)
    this.element.removeEventListener('sc-attrs-toggle', this.handleToggleAttributesBound)
    this.element.removeEventListener('sc-attrs-unset', this.handleUnsetAttributesBound)
  }
}
