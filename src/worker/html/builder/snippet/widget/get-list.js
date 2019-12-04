import { RequestResource } from './request-resource'

export class GetList extends RequestResource {
  constructor (options = {}) {
    super(options)

    this._count = null
    this._offset = null
    this._search = null

    this.setCount(options.count)
    this.setOffset(options.offset)
    this.setSearch(options.search)
  }

  getCount () {
    return this._count
  }

  setCount (value = null) {
    this._count = value
    return this
  }

  count (value) {
    return this.setCount(value)
  }

  getOffset () {
    return this._offset
  }

  setOffset (value = null) {
    this._offset = value
    return this
  }

  offset (value) {
    return this.setOffset(value)
  }

  getSearch () {
    return this._search
  }

  setSearch (value = null) {
    this._search = value
    return this
  }

  search (value) {
    return this.setSearch(value)
  }

  build (hb) {
    const qualifier = this._name.map((name, index) => {
      const id = index < this._name.length - 1
        ? `/%(${name}_id)s`
        : ''
      return `/${name}${id}`
    }).join('')

    let resource = [
      `/${this._prefix}`,
      `/${this._version}`,
      `/${this._level}`,
      qualifier
    ]

    resource = resource
      .filter((v) => v !== '/')
      .join('')

    const params = this.buildParams()

    return hb
      .request()
      .resource(
        `GET ${resource}?${params}`
      )
      .indicator(
        hb.selector('.loading')
      )
      .act(
        ...this._args
      )
      .err(
        hb.selector('.message')
      )
  }

  buildParams () {
    const names = ['count', 'offset', 'search']

    const expanded = names.filter((name) => {
      return this[`_${name}`] !== null
    }).map((name) => {
      return `${name}=${this[`_${name}`]}`
    }).join('&')

    const expand = names.filter((name) => {
      return this[`_${name}`] === null
    }).join(',')

    let string = expanded

    if (expand !== '') {
      string += string !== '' ? '&' : ''
      string += `{${expand}}`
    }

    return string
  }
}
