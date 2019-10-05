import { Widget } from '../widget'

export class GetObject extends Widget {
  buildWidget (args) {
    const b = this._builder

    const resource = '/api' + this._name.map((name) => {
      return `/${name}/%(${name}_id)s`
    }).join('')

    return b.request().resource(
      `GET ${resource}`
    ).indicator(
      b.selector('.progress')
    ).act(
      ...args
    ).err(
      b.selector('.message')
    )
  }
}
