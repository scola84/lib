import assignWith from 'lodash-es/assignWith'
import defaults from 'lodash-es/defaultsDeep'
import qs from 'qs'

export class Route {
  static parse (route, self) {
    if (route instanceof Route) {
      return route
    }

    if (typeof route === 'object') {
      return new Route(route)
    }

    if (route === undefined) {
      return route
    }

    const [splitPath, splitName = ''] = route.split('@')
    const [path, rawParams = ''] = splitPath.split(':')
    const [name, rawOptions = ''] = splitName.split(':')

    const options = {
      name,
      options: {},
      params: {},
      path
    }

    if (options.name === 'self') {
      options.name = self
    }

    if (options.path === '') {
      delete options.path
    }

    assignWith(options.options, qs.parse(rawOptions), () => true)
    assignWith(options.params, qs.parse(rawParams))

    return new Route(options)
  }

  constructor (options = {}) {
    defaults(this, options, {
      base: null,
      default: null,
      name: null,
      options: {
        bwd: false,
        clr: false,
        def: false,
        his: false,
        imm: false,
        ins: true,
        lck: false,
        ltr: false,
        mem: false,
        rtl: false
      },
      params: {},
      path: null,
      user: null
    })
  }

  format (filter) {
    let string = ''

    string += this.path
    string += this.formatParams()
    string += '@'
    string += this.name
    string += this.formatOptions(filter)

    return string
  }

  formatOptions (filter = []) {
    const names = Object.keys(this.options)

    let string = ''
    let name = null

    for (let i = 0; i < names.length; i += 1) {
      name = names[i]

      if (this.options[name] === true && filter.indexOf(name) > -1) {
        string += string.length === 0 ? ':' : '&'
        string += name
      }
    }

    return string
  }

  formatParams () {
    const names = Object.keys(this.params)

    let string = ''
    let name = null

    for (let i = 0; i < names.length; i += 1) {
      name = names[i]

      string += string.length === 0 ? ':' : '&'
      string += `${name}=${this.params[name]}`
    }

    return string
  }

  toJSON () {
    return this.format(['mem'])
  }
}
