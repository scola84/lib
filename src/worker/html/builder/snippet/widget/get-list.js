import { Widget } from '../widget'

export class GetList extends Widget {
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

  buildParams () {
    const names = ['count', 'offset', 'search']

    const expanded = names.filter((name) => {
      return this['_' + name] !== null
    }).map((name) => {
      return `${name}=${this['_' + name]}`
    }).join('&')

    const expand = names.filter((name) => {
      return this['_' + name] === null
    }).join(',')

    let string = expanded

    if (expand) {
      string += string ? '&' : ''
      string += `{${expand}}`
    }

    return string
  }

  buildWidget (args) {
    const b = this._builder

    const resource = '/api' + this._name.map((name, index) => {
      return `/${name}` +
        (index < this._name.length - 1 ? `/%(${name}_id)s` : '')
    }).join('')

    const params = this.buildParams()

    return b.request().resource(
      `GET ${resource}?${params}`
    ).indicator(
      b.selector('.loading')
    ).act(
      ...args
    ).err(
      b.selector('.message')
    )
  }
}
