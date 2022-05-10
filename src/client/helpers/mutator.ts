import { cast, isPrimitive, isStruct, toJoint } from '../../common'
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
  public static presets: Partial<Struct<Struct>> = {}

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
    if (!this.element.hasAttribute('sc-nolisten')) {
      this.addEventListeners()
    }
  }

  public disconnect (): void {
    if (!this.element.hasAttribute('sc-nolisten')) {
      this.removeEventListeners()
    }
  }

  public preset (): void {
    this.element
      .getAttribute('sc-preset')
      ?.split(/\s+/u)
      .forEach((name) => {
        this.setAttributes(Mutator.presets[name], false)
      })
  }

  public rotateAttribute (name: string, value: unknown): void {
    const attrName = name

    const attrValues = String(value)
      .trim()
      .split(',')

    const index = attrValues.findIndex((attrValue) => {
      return this.element.getAttribute(attrName)?.includes(attrValue)
    })

    const castValue = cast(attrValues[index + 1] ?? attrValues[0])

    if (typeof castValue === 'boolean') {
      this.element.toggleAttribute(attrName, castValue)
    } else if (isPrimitive(castValue)) {
      const attrValue = castValue.toString()

      if (this.sanitizer.checkAttribute(this.element.nodeName, name, attrValue)) {
        this.element.setAttribute(name, attrValue)
      }
    }
  }

  public rotateAttributes (data: unknown): void {
    if (isStruct(data)) {
      Object
        .entries(data)
        .map<[string, unknown]>(([name, value]) => {
        /* eslint-disable @typescript-eslint/indent */
          return [toJoint(name, { separator: '-' }), value]
        })
        /* eslint-enable @typescript-eslint/indent */
        .forEach(([name, value]) => {
          this.rotateAttribute(name, value)
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

  public setAttribute (name: string, value: unknown, overwrite = true): void {
    if (
      overwrite ||
      !this.element.hasAttribute(name)
    ) {
      const castValue = cast(value)

      if (castValue === false) {
        this.element.removeAttribute(name)
      } else if (castValue === true) {
        this.element.setAttribute(name, '')
      } else if (isPrimitive(castValue)) {
        const attrValue = castValue.toString()

        if (this.sanitizer.checkAttribute(this.element.nodeName, name, attrValue)) {
          this.element.setAttribute(name, attrValue)
        }
      }
    }
  }

  public setAttributes (data: unknown, overwrite = true): void {
    if (isStruct(data)) {
      Object
        .entries(data)
        .map<[string, unknown]>(([name, value]) => {
        /* eslint-disable @typescript-eslint/indent */
          return [toJoint(name, { separator: '-' }), value]
        })
        /* eslint-enable @typescript-eslint/indent */
        .forEach(([name, value]) => {
          this.setAttribute(name, value, overwrite)
        })
    }
  }

  public toggleAttribute (name: string, value: unknown): void {
    const castValue = cast(value)

    if (typeof castValue === 'boolean') {
      this.element.toggleAttribute(name)
    } else if (value === this.element.getAttribute(name)) {
      this.element.removeAttribute(name)
    } else if (isPrimitive(castValue)) {
      const attrValue = castValue.toString()

      if (this.sanitizer.checkAttribute(this.element.nodeName, name, attrValue)) {
        this.element.setAttribute(name, attrValue)
      }
    }
  }

  public toggleAttributes (data: unknown): void {
    if (isStruct(data)) {
      Object
        .entries(data)
        .map<[string, unknown]>(([name, value]) => {
        /* eslint-disable @typescript-eslint/indent */
          return [toJoint(name, { separator: '-' }), value]
        })
        /* eslint-enable @typescript-eslint/indent */
        .forEach(([name, value]) => {
          this.toggleAttribute(name, value)
        })
    }
  }

  public unsetAttributes (data: unknown): void {
    if (isStruct(data)) {
      Object
        .keys(data)
        .map((name) => {
          return toJoint(name, { separator: '-' })
        })
        .forEach((name) => {
          this.element.removeAttribute(name)
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
