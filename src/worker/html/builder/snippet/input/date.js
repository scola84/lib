import { select } from 'd3-selection'
import { DateTime as Luxon } from 'luxon'
import { DateTime } from './datetime'

export class Date extends DateTime {
  constructor (options = {}) {
    super(options)

    this
      .attributes({
        type: 'date'
      })
      .formatFrom('yyyy-MM-dd')
      .formatTo('D')
  }

  changeValue () {
    const formatFrom = this.resolveValue(null, null, this._formatFrom)
    const formatTo = this.resolveValue(null, null, this._formatTo)

    let value = this._node.property('value')

    value = value || Luxon
      .local()
      .toFormat(formatFrom)

    const date = Luxon
      .fromFormat(value, formatFrom)
      .toISO()

    const text = this._builder
      .print()
      .format(`%l[${formatTo}]`)
      .values(date)

    select(this._node.node().nextSibling)
      .text(this.resolveValue(null, null, text))

    this._node.value = value

    return this._node
  }

  removeBefore () {
    this._node.on('.scola-date', null)
    this.removeOuter()
  }

  wrapInput () {
    const wrapper = this
      .wrapNode('div')
      .classed('input date', true)

    wrapper
      .append('label')
      .attr('tabindex', 0)
      .attr('for', `date-${this._id}`)

    this._node
      .attr('id', `date-${this._id}`)
      .attr('tabindex', -1)
      .on('input.scola-date', () => {
        this.changeValue()
      })
  }
}
