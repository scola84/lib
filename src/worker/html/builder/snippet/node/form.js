import { select } from 'd3-selection'
import { Node } from '../node'

export class Form extends Node {
  constructor (options) {
    super(options)

    this
      .attributes({
        novalidate: 'novalidate'
      })
      .name('form')
  }

  resolveAfter () {
    const label = this._node
      .selectAll('.label:not(:last-child)')

    let max = 0

    label.each((datum, index, nodes) => {
      max = Math.max(
        max,
        Math.ceil(
          parseFloat(
            select(nodes[index]).style('width')
          )
        )
      )
    })

    this._node
      .selectAll('.label:not(:last-child)')
      .style('width', max + 'px')

    return this._node
  }
}
