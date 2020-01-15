import * as d3 from 'd3-selection'
import * as luxon from 'luxon'
import { DateTime } from './datetime.js'

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

    value = value || luxon.DateTime
      .local()
      .toFormat(formatFrom)

    const date = luxon.DateTime
      .fromFormat(value, formatFrom)
      .toISO()

    const text = this._builder
      .print()
      .format(`%l[${formatTo}]`)
      .values(date)

    d3.select(this._node.node().nextSibling)
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
