import type { SchemaFieldKey } from '../schema'
import type { Struct } from '../../../common'

export interface SqlQuery<Values = Struct> {
  string: string
  values?: Values
}

export interface SqlQueryKeys {
  auth?: Struct<SchemaFieldKey[][]>
  foreign?: SchemaFieldKey[]
  primary?: SchemaFieldKey[]
  related?: SchemaFieldKey[]
  search?: SchemaFieldKey[]
  sort?: SchemaFieldKey[]
}

export interface SqlQueryParts {
  join?: string
  limit?: string
  order?: string
  parts?: SqlQueryParts[]
  select?: string
  values?: Struct
  where?: string
}

export interface SqlSelectAllParameters extends Struct {
  count: number
  cursor?: string
  offset?: number
  search?: string
  sortKey?: string
  sortOrder?: string
}
