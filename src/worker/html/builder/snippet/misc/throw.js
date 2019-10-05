import { Snippet } from '../snippet'

export class Throw extends Snippet {
  resolveAfter (box, error) {
    throw error
  }
}
