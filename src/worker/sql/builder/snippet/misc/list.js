import { Snippet } from '../snippet.js'

export class List extends Snippet {
  setParens (value = true) {
    return super.setParent(value)
  }
}
