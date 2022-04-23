import type { ChildNode, Element } from 'parse5/dist/tree-adapters/default'
import type { Schema, SchemaField, SchemaFieldKey } from './validator'
import { Struct, cast, isArray, isObject, isStruct, toJoint } from '../../../common'
import { parse } from 'path'
import { parseFragment } from 'parse5'
import { readFile } from 'fs-extra'

export interface SchemaParserResult {
  name: string
  schema: Schema
}

export type SchemaAttributes = Partial<Struct<string>>

export class SchemaParser {
  public async parse (file: string, schema: Partial<Schema> = {}, id?: string): Promise<SchemaParserResult | undefined> {
    const {
      dir,
      name
    } = parse(file)

    const html = (await readFile(file)).toString()
    const node = parseFragment(html).childNodes[0]

    if (this.isElement(node)) {
      const root = this.findRoot(node, id) ?? node

      if (this.isElement(root)) {
        return {
          name: this.normalizeAttributes(root).name ?? toJoint(name, {
            separator: '_'
          }),
          schema: await this.extract(root, schema, dir)
        }
      }
    }

    return undefined
  }

  protected async extract (element: Element, schema: Partial<Schema>, dir: string): Promise<Schema> {
    const attributes = this.normalizeAttributes(element)

    if (
      element.nodeName === 'fieldset' ||
      element.nodeName === 'input' ||
      element.nodeName === 'select' ||
      element.nodeName === 'textarea'
    ) {
      if (
        typeof attributes.name === 'string' &&
        attributes['sc-nofield'] === undefined
      ) {
        let field = schema[attributes.name]

        if (field === undefined) {
          field = {
            type: ''
          }

          this.extractBase(attributes, field)
          this.extractFile(attributes, field)
          this.extractNumber(attributes, field)
          this.extractString(attributes, field)

          if (element.nodeName === 'fieldset') {
            await this.extractFieldset(field, element, dir)
          } else if (element.nodeName === 'select') {
            this.extractSelect(field, element)
          } else if (element.nodeName === 'textarea') {
            this.extractTextarea(field)
          }

          this.extractDatabaseAuth(attributes, field)
          this.extractDatabaseOptions(attributes, field)
          schema[attributes.name] = field
        } else if (field.type === 'checkbox') {
          field.values?.push(cast(attributes.value))
        } else if (field.type === 'radio') {
          field.values?.push(cast(attributes.value))
          this.extractRadio(attributes, field)
        }

        return this.sortObject(schema) as Schema
      }
    }

    await this.extractView(attributes, schema, dir)

    if (Array.isArray(element.childNodes)) {
      await Promise.all(element.childNodes.map(async (child) => {
        if (this.isElement(child)) {
          return this.extract(child, schema, dir)
        }

        return Promise.resolve()
      }))
    }

    return this.sortObject(schema) as Schema
  }

  protected extractBase (attributes: SchemaAttributes, field: SchemaField): void {
    if (attributes.type !== undefined) {
      field.type = attributes.type

      if (field.type === 'checkbox') {
        field.values = [cast(attributes.value)]

        if (field.values[0] === true) {
          field.values[1] = false
        }
      } else if (field.type === 'radio') {
        field.values = [cast(attributes.value)]
        this.extractRadio(attributes, field)
      } else if (attributes.value !== undefined) {
        field.value = cast(attributes.value) ?? undefined
      } else if (attributes['sc-value'] !== undefined) {
        field.value = cast(attributes['sc-value']) ?? undefined
      }
    }

    field.hidden = attributes.hidden !== undefined
    field.readonly = attributes.readonly !== undefined
    field.required = attributes.required !== undefined
    field.strict = attributes['sc-strict'] !== undefined

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

    if (attributes['sc-rkey'] !== undefined) {
      field.rkey = this.extractDatabaseKey(attributes['sc-rkey'])
    }

    field.index = attributes['sc-index']
    field.unique = attributes['sc-unique']
    field.fkeyDelete = attributes['sc-fkey-delete']
    field.mkey = attributes['sc-mkey'] !== undefined
    field.order = attributes['sc-order'] !== undefined
    field.pkey = attributes['sc-pkey'] !== undefined
    field.serial = attributes['sc-serial'] !== undefined
    field.var = attributes['sc-var']
    field.where = attributes['sc-where'] !== undefined
  }

  protected async extractFieldset (field: SchemaField, element: Element, dir: string): Promise<void> {
    field.type = 'fieldset'

    const schema = {}

    await Promise.all(element.childNodes.map(async (child) => {
      if (this.isElement(child)) {
        return this.extract(child, schema, dir)
      }

      return Promise.resolve()
    }))

    if (Object.keys(schema).length > 0) {
      field.schema = schema
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
      field.value = attributes.value
    }
  }

  protected extractSelect (field: SchemaField, element: Element): void {
    field.type = 'select'
    field.values = []

    for (const option of element.childNodes) {
      if (option.nodeName === 'option') {
        const optionAttributes = this.normalizeAttributes(option)

        field.values.push(optionAttributes.value)

        if (optionAttributes.selected === '') {
          field.value = optionAttributes.value
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

  protected extractTextarea (field: SchemaField): void {
    field.type = 'textarea'
  }

  protected async extractView (attributes: SchemaAttributes, schema: Partial<Schema>, dir: string): Promise<void> {
    if (
      attributes.is === 'sc-view' &&
      typeof attributes['sc-name'] === 'string' &&
      attributes['sc-noparse'] === undefined
    ) {
      await this.parse(`${dir}/${attributes['sc-name']}.html`, schema)
    }
  }

  protected findAll (element: Element, filter: (childNode: ChildNode) => boolean, found: Element[] = []): Element[] {
    for (const childNode of element.childNodes) {
      if (this.isElement(childNode)) {
        if (filter(childNode)) {
          found.push(childNode)
        }

        this.findAll(childNode, filter, found)
      }
    }

    return found
  }

  protected findRoot (element: Element, id?: string): Element | null {
    const attributes = this.normalizeAttributes(element)

    if (attributes.id === id) {
      return element
    }

    let found = null

    for (const childNode of element.childNodes) {
      if (this.isElement(childNode)) {
        found = this.findRoot(childNode, id)

        if (found !== null) {
          return found
        }
      }
    }

    return found
  }

  protected isElement (value: unknown): value is Element {
    return (
      isObject(value) &&
      value.attrs !== undefined
    )
  }

  protected normalizeAttributes (element: Element): SchemaAttributes {
    const attributes = Struct.create<SchemaAttributes>()

    if (isArray(element.attrs)) {
      return element.attrs.reduce<SchemaAttributes>((result, attribute) => {
        return {
          ...result,
          [attribute.name]: attribute.value
        }
      }, attributes)
    }

    return attributes
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
      }, Struct.create())
      /* eslint-disable @typescript-eslint/indent */
  }
}
