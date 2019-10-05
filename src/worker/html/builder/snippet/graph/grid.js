import { Axis } from './axis'
import { Parent } from '../parent'

export class Grid extends Parent {
  constructor (options) {
    super(options)
    this.class('transition')
  }

  removeInner () {
    this.removeChildren()
    this.removeAfter()
  }

  resolveBefore (box, data) {
    this.removeChildren()
    return this.resolveOuter(box, data)
  }

  resolveInner (box, data) {
    const [line] = this._args

    const axes = this._builder.selector((snippet) => {
      return snippet instanceof Axis
    }).resolve()

    let distance = null
    let node = null
    let orientation = null
    let position = null
    let property = null
    let scale = null
    let ticks = null
    let value = null

    for (let i = 0; i < axes.length; i += 1) {
      scale = axes[i].getScale()

      orientation = scale.mapOrientation()
      position = scale.getPosition()
      property = scale.mapPosition()
      ticks = scale.calculateTicks()

      for (let j = 0; j < ticks.length; j += 1) {
        [value, distance] = ticks[j]
        node = this.appendChild(box, value, line)

        node
          .classed(orientation, true)
          .classed(position, true)
          .style(property, Math.floor(distance) + 'px')
      }
    }

    return this.resolveAfter(box, data)
  }
}
