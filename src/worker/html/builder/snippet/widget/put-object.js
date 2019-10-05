import { Widget } from '../widget'

export class PutObject extends Widget {
  buildWidget () {
    const b = this._builder

    const resource = '/api' + this._name.map((name) => {
      return `/${name}/%(${name}_id)s`
    }).join('')

    return b.request().resource(
      `PUT ${resource}`
    ).indicator(
      b.selector('.progress')
    ).act(
      b.route().view('@self:clr'),
      b.route().view('@main:his')
    ).err(
      b.selector('.message'),
      b.selector('.body .hint')
    )
  }
}
