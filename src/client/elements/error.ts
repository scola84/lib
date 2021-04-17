export class ScolaError extends Error {
  public code?: string

  public data?: Record<string, unknown>

  public constructor (message: string, code?: ScolaError['code'], data?: ScolaError['data']) {
    super(message)
    this.code = code
    this.data = data
  }
}
