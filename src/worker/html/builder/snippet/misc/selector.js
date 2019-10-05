import { Snippet } from '../snippet'

export class Selector extends Snippet {
  find (compare) {
    const snippets = this.resolve()
    let result = []

    for (let i = 0; i < snippets.length; i += 1) {
      result = result.concat(snippets[i].find(compare))
    }

    return result
  }

  resolveAfter (box, data) {
    const [query] = this._args

    if (typeof query === 'function') {
      return this.resolveFunction(box, data, query)
    }

    return this.resolveString(box, data, query)
  }

  resolveFunction (box, data, query) {
    const result = []

    const snippets = this._builder
      .getView()
      .find(query)

    for (let i = 0; i < snippets.length; i += 1) {
      result[result.length] = box
        ? this.resolveValue(box, data, snippets[i])
        : snippets[i]
    }

    return result
  }

  resolveString (box, data, query) {
    const result = []

    this._builder
      .getView()
      .node()
      .selectAll(query)
      .each((datum, index, nodes) => {
        result[result.length] = box
          ? this.resolveValue(box, data, nodes[index].snippet)
          : nodes[index].snippet
      })

    return result
  }
}
