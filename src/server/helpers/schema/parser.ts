import type { ChildNode, Element } from 'parse5'
import type { Schema, SchemaField, SchemaFieldKey } from './validator'
import { isArray, isStruct } from '../../../common'
import type { Struct } from '../../../common'
import { dirname } from 'path'
import { parseFragment } from 'parse5'
import { readFile } from 'fs-extra'

export type SchemaAttributes = Struct<string | undefined>

export class SchemaParser {
  public async parse (url: string, fields: Schema = {}): Promise<Schema> {
    const dir = dirname(url)
    const [file, id] = url.split('#')
    const html = (await readFile(file)).toString()
    const node = parseFragment(html)
    const root = this.findRoot(node as Element, id) ?? node
    return this.extract(root as Element, fields, dir)
  }

  protected async extract (element: Element, fields: Schema, dir: string): Promise<Schema> {
    const attributes = this.normalizeAttributes(element)

    if (
      element.nodeName === 'input' ||
      element.nodeName === 'select' ||
      element.nodeName === 'textarea'
    ) {
      if (typeof attributes.name === 'string') {
        let field = fields[attributes.name]

        if (typeof field === 'undefined') {
          field = {
            type: ''
          }

          this.extractBase(attributes, field)
          this.extractFile(attributes, field)
          this.extractNumber(attributes, field)
          this.extractString(attributes, field)

          if (element.nodeName === 'select') {
            this.extractSelect(attributes, element.childNodes, field)
          }

          this.extractDatabaseAuth(attributes, field)
          this.extractDatabaseOptions(attributes, field)
          fields[attributes.name] = field
        } else if (field.type === 'checkbox') {
          field.values?.push(attributes.value)
        } else if (field.type === 'radio') {
          field.values?.push(attributes.value)
          this.extractRadio(attributes, field)
        }
      }
    }

    await this.extractView(attributes, fields, dir)

    if (Array.isArray(element.childNodes)) {
      await Promise.all(element.childNodes.map(async (child) => {
        await this.extract(child as Element, fields, dir)
      }))
    }

    return this.sortObject(fields) as Schema
  }

  protected extractBase (attributes: SchemaAttributes, field: SchemaField): void {
    if (attributes.type !== undefined) {
      field.type = attributes.type

      if (field.type === 'checkbox') {
        field.values = [attributes.value]
      } else if (field.type === 'radio') {
        field.values = [attributes.value]
        this.extractRadio(attributes, field)
      } else if (attributes.value !== undefined) {
        field.default = attributes.value
      } else if (attributes['sc-value'] !== undefined) {
        field.default = attributes['sc-value']
      }
    }

    if (attributes.required !== undefined) {
      field.required = true
    }

    if (attributes['sc-custom'] !== undefined) {
      field.custom = attributes['sc-custom']
    }
  }

  protected extractDatabaseAuth (attributes: SchemaAttributes, field: SchemaField): void {
    const auth = [
      attributes['sc-auth-group'],
      attributes['sc-auth-user']
    ].filter((keys) => {
      return keys !== undefined
    }).map((keys) => {
      return (keys ?? '')
        .split(' ')
        .map((key) => {
          return this.extractDatabaseKey(key)
        })
    })

    if (auth.length > 0) {
      field.auth = auth
    }
  }

  protected extractDatabaseKey (string: string): SchemaFieldKey {
    const [
      table,
      column
    ] = string.split('.')

    return {
      column,
      table
    }
  }

  protected extractDatabaseOptions (attributes: SchemaAttributes, field: SchemaField): void {
    if (attributes['sc-cursor'] !== undefined) {
      field.cursor = Number(attributes['sc-cursor'])
    }

    if (attributes['sc-fkey'] !== undefined) {
      field.fkey = this.extractDatabaseKey(attributes['sc-fkey'])
    }

    if (attributes['sc-index'] !== undefined) {
      field.index = attributes['sc-index']
    }

    if (attributes['sc-rkey'] !== undefined) {
      field.rkey = this.extractDatabaseKey(attributes['sc-rkey'])
    }

    if (attributes['sc-pkey'] !== undefined) {
      field.pkey = true
    }

    if (attributes['sc-search'] !== undefined) {
      field.search = true
    }

    if (attributes['sc-serial'] !== undefined) {
      field.serial = true
    }

    if (attributes['sc-sort'] !== undefined) {
      field.sort = true
    }

    if (attributes['sc-unique'] !== undefined) {
      field.unique = attributes['sc-unique']
    }
  }

  protected extractFile (attributes: SchemaAttributes, field: SchemaField): void {
    if (attributes.accept !== undefined) {
      field.accept = attributes.accept
        .split(',')
        .map((accept) => {
          return accept.trim()
        })
    }
  }

  protected extractNumber (attributes: SchemaAttributes, field: SchemaField): void {
    if (attributes.max !== undefined) {
      field.max = Number(attributes.max)
    }

    if (attributes.min !== undefined) {
      field.min = Number(attributes.min)
    }

    if (attributes.step !== undefined) {
      field.step = Number(attributes.step)
    }
  }

  protected extractRadio (attributes: SchemaAttributes, field: SchemaField): void {
    if (
      attributes.checked === '' &&
      attributes.value !== undefined
    ) {
      field.default = attributes.value
    }
  }

  protected extractSelect (attributes: SchemaAttributes, childNodes: ChildNode[], field: SchemaField): void {
    field.values = []

    for (const option of childNodes) {
      if (option.nodeName === 'option') {
        const optionAttributes = this.normalizeAttributes(option)

        field.values.push(optionAttributes.value)

        if (optionAttributes.selected === '') {
          field.default = optionAttributes.value
        }
      }
    }
  }

  protected extractString (attributes: SchemaAttributes, field: SchemaField): void {
    if (attributes.maxLength !== undefined) {
      field.maxLength = Number(attributes.maxLength)
    }

    if (attributes.minLength !== undefined) {
      field.minLength = Number(attributes.minLength)
    }

    if (attributes.pattern !== undefined) {
      field.pattern = new RegExp(attributes.pattern, 'iu')
    }
  }

  protected async extractView (attributes: SchemaAttributes, fields: Schema, dir: string): Promise<void> {
    if (
      attributes.is === 'sc-view' &&
      typeof attributes['sc-name'] === 'string' &&
      attributes['sc-noparse'] === undefined
    ) {
      await this.parse(`${dir}/${attributes['sc-name']}.html`, fields)
    }
  }

  protected findRoot (element: Element, id?: string): Element | null {
    const attributes = this.normalizeAttributes(element)

    if (attributes.id === id) {
      return element
    }

    let found = null

    for (const child of element.childNodes) {
      if (
        child.nodeName !== '#comment' &&
        child.nodeName !== '#text'
      ) {
        found = this.findRoot(child as Element, id)

        if (found !== null) {
          return found
        }
      }
    }

    return found
  }

  protected normalizeAttributes (element: Element): SchemaAttributes {
    if (isArray(element.attrs)) {
      return element.attrs.reduce((attributes, attribute) => {
        return {
          ...attributes,
          [attribute.name]: attribute.value
        }
      }, {})
    }

    return {}
  }

  protected sortObject (object: Struct): Struct {
    return Object
      .keys(object)
      .sort()
      .reduce<Struct>((result, key) => {
      /* eslint-disable @typescript-eslint/indent */
        const value = object[key]

        if (isStruct(value)) {
          result[key] = this.sortObject(value)
        } else {
          result[key] = value
        }

        return result
      }, {})
      /* eslint-disable @typescript-eslint/indent */
  }
}
