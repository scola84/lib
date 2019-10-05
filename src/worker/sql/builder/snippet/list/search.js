import trim from 'lodash-es/trim'
import { Snippet } from '../snippet'

export class Search extends Snippet {
  constructor (options = {}) {
    super(options)

    this._columns = null
    this._inner = null
    this._outer = null
    this._search = null
    this._wildcard = null

    this.setColumns(options.columns)
    this.setInner(options.inner)
    this.setOuter(options.outer)
    this.setSearch(options.search)
    this.setWildcard(options.wildcard)
  }

  getOptions () {
    return Object.assign(super.getOptions(), {
      columns: this._columns,
      inner: this._inner,
      outer: this._outer,
      search: this._search,
      wildcard: this._wildcard
    })
  }

  getColumns () {
    return this._columns
  }

  setColumns (value = []) {
    this._columns = value
    return this
  }

  columns (...columns) {
    return this.setColumns(
      this._columns.concat(columns)
    )
  }

  getInner () {
    return this._inner
  }

  setInner (value = 'AND') {
    this._inner = value
    return this
  }

  inner (value) {
    return this.setInner(value)
  }

  getOuter () {
    return this._outer
  }

  setOuter (value = 'OR') {
    this._outer = value
    return this
  }

  outer (value) {
    return this.setOuter(value)
  }

  setParens (value = true) {
    return super.setParens(value)
  }

  getSearch () {
    return this._search
  }

  setSearch (value = '') {
    this._search = value
    return this
  }

  search (value) {
    return this.setSearch(value)
  }

  getWildcard () {
    return this._wildcard
  }

  setWildcard (value = /\*/g) {
    this._wildcard = value
    return this
  }

  wildcard (value) {
    return this.setWildcard(value)
  }

  resolveInner (box, data) {
    const columns = this.resolveValue(box, data, this._columns)
    const inner = this.resolveValue(box, data, this._inner)
    const outer = this.resolveValue(box, data, this._outer)
    const search = this.resolveValue(box, data, this._search)
    const wildcard = this.resolveValue(box, data, this._wildcard)

    let match = []
    let string = ''

    if (typeof search === 'string') {
      match = search.match(/[^"\s]+|"[^"]+"/g) || []
    }

    for (let i = 0; i < columns.length; i += 1) {
      string += i === 0 ? '(' : ` ${outer} (`
      string += match.length === 0 ? 'true' : ''

      for (let j = 0; j < match.length; j += 1) {
        string += j === 0 ? '' : ` ${inner} `

        string += this.resolveEscape(
          this.resolveValue(box, data, columns[i]),
          'id'
        )

        string += ' LIKE '

        string += this.resolveEscape(
          trim(match[j].replace(wildcard, '%')),
          'value'
        )
      }

      string += ')'
    }

    string = string || 'true'

    return this.resolveParens(string, this._parens)
  }
}
