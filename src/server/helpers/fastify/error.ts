import type { ValidationResult } from 'fastify'

export class ServerError {
  public code = 'ERR_UNDEFINED'

  public data: Record<string, unknown> = {}

  public constructor (
    code?: string,
    validation?: ValidationResult[]
  ) {
    if (Array.isArray(validation)) {
      this.code = 'ERR_INPUT_INVALID'
      this.data = validation.reduce((data, result) => {
        return this.normalize(data, result)
      }, {})
    } else if (code !== undefined) {
      this.code = code.replace('FST_ERR', 'ERR')
    }
  }

  protected normalize (
    data: Record<string, unknown>,
    result: ValidationResult
  ): Record<string, unknown> {
    switch (result.keyword) {
      case 'required':
        this.normalizeRequired(data, result)
        break
      default:
        this.normalizeDefault(data, result)
        break
    }

    return data
  }

  protected normalizeDefault (
    data: Record<string, unknown>,
    { dataPath, keyword, params }: ValidationResult
  ): void {
    data[dataPath.slice(1)] = {
      code: `ERR_INPUT_${String(params[keyword]).toUpperCase()}`
    }
  }

  protected normalizeRequired (
    data: Record<string, unknown>,
    { params }: ValidationResult
  ): void {
    data[String(params.missingProperty)] = {
      code: 'ERR_INPUT_REQUIRED'
    }
  }
}
