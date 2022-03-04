/* eslint-disable max-lines-per-function */
import type { Schema } from '../../../server/helpers/schema'

export function getAll (object: string, schema: Schema): string {
  return `
import type { RouteData, RouteHandlerOptions } from '@scola/lib'
import { RouteHandler, sql } from '@scola/lib'

interface GetAllData extends RouteData {
  query: {
    count: number
    cursor?: string
    offset?: number
    search?: string
    sortKey?: string
    sortOrder: string
  }
}

export interface GetAllHandlerOptions extends Partial<RouteHandlerOptions> {}

export class GetAllHandler extends RouteHandler {
  public responseType = 'application/json'

  public schema = {
    query: {
      count: {
        required: true,
        type: 'number'
      },
      cursor: {
        type: 'text'
      },
      offset: {
        type: 'number'
      },
      search: {
        type: 'text'
      },
      sortKey: {
        type: 'select',
        values: [
${Object
  .entries(schema)
  .filter(([,field]) => {
    return field.sort === true
  })
  .map(([name]) => {
    return `'${name}'`
  })
  .map((line) => {
    return line.padStart(line.length + 10, ' ')
  })
  .join(',\n')}
        ]
      },
      sortOrder: {
        default: 'asc',
        type: 'select',
        values: ['asc', 'desc']
      }
    }
  }

  public search = [
${Object
  .entries(schema)
  .filter(([,field]) => {
    return field.search === true
  })
  .map(([name]) => {
    return `'${name}'`
  })
  .map((line) => {
    return line.padStart(line.length + 4, ' ')
  })
  .join(',\n')}
  ]

  public constructor (options: GetAllHandlerOptions) {
    super(options)
  }

  protected async handle (data: GetAllData): Promise<unknown[]> {
    const {
      limit,
      order: limitOrder,
      where: limitWhere,
      values: limitValues
    } = this.database.formatter.formatLimit(data.query)

    const {
      where: searchWhere,
      values: searchValues
    } = this.database.formatter.formatSearch(data.query, this.search)

    const {
      order
    } = this.database.formatter.formatSort(data.query)

    return this.database.selectAll(sql\`
      SELECT *
      FROM $[contact]
      WHERE \${[
        searchWhere ?? 1,
        limitWhere ?? 1
      ].join(' AND ')}
      ORDER BY \${limitOrder ?? order}
      \${limit}
    \`, {
      ...searchValues,
      ...limitValues
    })
  }
}
`.trim()
}
