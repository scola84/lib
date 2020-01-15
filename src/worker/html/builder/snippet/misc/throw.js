import { Snippet } from '../snippet.js'

export class Throw extends Snippet {
  resolveAfter (box, error) {
    throw error
  }
}
