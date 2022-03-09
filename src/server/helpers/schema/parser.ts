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

          if (element.nodeName === 'select') {
            this.extractSelect(attributes, element.childNodes, field)
          } else if (element.nodeName === 'textarea') {
            this.extractTextarea(field)
          }

          this.extractConstraints(attributes, field)
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

    return this.sortObject(fields)
  }

  protected extractConstraints (attributes: SchemaAttributes, field: SchemaField): void {
    if (attributes.type !== undefined) {
      field.type = attributes.type

      if (field.type === 'checkbox') {
        field.values = [attributes.value]
      } else if (field.type === 'radio') {
        field.values = [attributes.value]
        this.extractRadio(attributes, field)
      } else if (attributes.value !== undefined) {
        field.default = attributes.value
      }
    }

    if (attributes.max !== undefined) {
      field.max = Number(attributes.max)
    }

    if (attributes.maxLength !== undefined) {
      field.maxLength = Number(attributes.maxLength)
    }

    if (attributes.min !== undefined) {
      field.min = Number(attributes.min)
    }

    if (attributes.minLength !== undefined) {
      field.minLength = Number(attributes.minLength)
    }

    if (attributes.pattern !== undefined) {
      field.pattern = new RegExp(attributes.pattern, 'iu')
    }

    if (attributes.required !== undefined) {
      field.required = true
    }

    if (attributes.step !== undefined) {
      field.step = Number(attributes.step)
    }

    if (attributes['sc-custom'] !== undefined) {
      field.custom = attributes['sc-custom']
    }
  }

  protected extractDatabaseKey (string: string): SchemaFieldKey | undefined {
    return (((/(?<table>.+)\.(?<column>.+)/u).exec(string))?.groups as unknown as SchemaFieldKey | null) ?? undefined
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

    if (attributes['sc-lkey'] !== undefined) {
      field.lkey = this.extractDatabaseKey(attributes['sc-lkey'])
    }

    if (attributes['sc-pkey'] !== undefined) {
      field.pkey = true
    }

    if (attributes['sc-search'] !== undefined) {
      field.search = true
    }

    if (attributes['sc-sort'] !== undefined) {
      field.sort = true
    }

    if (attributes['sc-type'] !== undefined) {
      field.type = attributes['sc-type']
    }

    if (attributes['sc-unique'] !== undefined) {
      field.unique = attributes['sc-unique']
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
    if (attributes.multiple === undefined) {
      field.type = 'select'
    } else {
      field.type = 'selectall'
    }

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

  protected extractTextarea (field: SchemaField): void {
    field.type = 'textarea'
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
      return element.attrs.reduce<SchemaAttributes>((attributes, attribute) => {
        attributes[attribute.name] = attribute.value
        return attributes
      }, {})
    }

    return {}
  }

  protected sortObject<T> (object: Struct): T {
    return Object
      .keys(object)
      .sort()
      .reduce<Struct>((result, key) => {
      const value = object[key]

      if (isStruct(value)) {
        result[key] = this.sortObject(value)
      } else {
        result[key] = value
      }

      return result
    }, {}) as T
  }
}
