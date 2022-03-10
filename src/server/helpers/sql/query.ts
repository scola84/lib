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

export interface QueryKeys {
  auth?: Struct<SchemaFieldKey[][]>
  foreign?: SchemaFieldKey[]
  link?: SchemaFieldKey[]
  primary?: SchemaFieldKey[]
  search?: SchemaFieldKey[]
  sort?: SchemaFieldKey[]
}

export interface QueryOutput {
  query: string
  values: Struct
}

export interface QueryParts {
  join?: string
  limit?: string
  order?: string
  parts?: QueryParts[]
  select?: string
  values?: Struct
  where?: string
}
