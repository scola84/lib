import type { SchemaFieldKey } from '../schema'
import type { Struct } from '../../../common'

export interface Query extends Struct {
  count: number
  cursor?: string
  offset?: number
  search?: string
  sortKey?: string
  sortOrder?: string
}

export interface QueryClauses {
  join?: string
  limit?: string
  order?: string
  select?: string
  values?: Struct
  where?: string
}

export interface QueryKeys {
  foreign?: SchemaFieldKey[]
  link?: SchemaFieldKey[]
  search?: SchemaFieldKey[]
  sort?: SchemaFieldKey[]
}
