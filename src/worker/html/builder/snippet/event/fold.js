import { select } from 'd3-selection'
import { Event } from '../event'

export class Fold extends Event {
  constructor (options = {}) {
    super(options)
    this.name('click')
  }

  attach (item, immediate) {
    item.style('width')

    if (immediate) {
      item.style('transition-duration', '0s')
    }

    item
      .classed('out', false)
      .on('transitionend.scola-fold', () => {
        item
          .style('height', null)
          .style('transition-duration', null)
          .on('.scola-fold', null)
      })

    const duration = parseFloat(
      item.style('transition-duration')
    )

    if (duration === 0) {
      item.dispatch('transitionend')
    }
  }

  detach (item, immediate) {
    const height = item.node().getBoundingClientRect().height

    item.style('height', height + 'px')
    item.style('width')

    if (immediate) {
      item.style('transition-duration', '0s')
    }

    item
      .classed('out', true)
      .on('transitionend.scola-fold', () => {
        item
          .style('transition-duration', null)
          .on('transitionend.scola-fold', null)
          .remove()
      })

    const duration = parseFloat(item.style('transition-duration'))

    if (height === 0 || duration === 0) {
      item.dispatch('transitionend')
    }
  }

  fold (box, data, snippet, immediate = false) {
    const group = snippet.node()
    const isFolded = group.classed('folded')

    const snippets = this._filter
      ? this._filter(snippet)
      : snippet.find((s) => s.node && s.node().classed('item'))

    group.classed('folded', !isFolded)

    if (isFolded) {
      this.show(snippets, immediate)
    } else {
      this.hide(snippets, immediate)
    }
  }

  handle (box, data, snippet, event) {
    const handle = event.target.closest('.title')

    if (handle === null) {
      return
    }

    const mustFold = select(handle)
      .classed('fold handle')

    if (mustFold === true) {
      this.fold(box, data, snippet)
      this.save(box, data, snippet)
    }
  }

  hide (snippets, immediate) {
    let item = null

    for (let i = 0; i < snippets.length; i += 1) {
      item = snippets[i].node()

      item.next = item.node().nextSibling
      item.parent = item.node().parentNode

      this.detach(item, immediate)
    }
  }

  load (box, data, snippet) {
    const isFolded = Boolean(
      Number(
        this._storage.getItem(`fold-${this._id}`)
      )
    )

    snippet
      .node()
      .classed('folded', !isFolded)
  }

  resolveAfter (box, data) {
    const result = []
    let snippet = null

    for (let i = 0; i < this._args.length; i += 1) {
      snippet = this._args[i]

      this.load(box, data, snippet)
      this.fold(box, data, snippet, true)

      result[result.length] = snippet.node()
    }

    return result
  }

  save (box, data, snippet) {
    const isFolded = snippet
      .node()
      .classed('folded')

    this._storage.setItem(
      `fold-${this._id}`,
      Number(isFolded)
    )
  }

  show (snippets, immediate) {
    let item = null

    for (let i = snippets.length - 1; i >= 0; i -= 1) {
      item = snippets[i].node()

      if (item.parent) {
        if (item.next) {
          item.parent.insertBefore(item.node(), item.next)
        } else {
          item.parent.appendChild(item.node())
        }
      }

      this.attach(item, immediate)
    }
  }
}
