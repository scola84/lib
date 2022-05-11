import { RouteHandler, sql } from '../../../helpers'
import type { View, ViewGroup, ViewUser } from '../../../../common'
import type { RouteData } from '../../../helpers'
import type { ServerResponse } from 'http'

interface ViewGetHandlerData extends RouteData {
  query: {
    name: string
  }
}

export class ViewGetHandler extends RouteHandler {
  public authorize = false

  public schema = {
    query: {
      required: true,
      schema: {
        name: {
          required: true,
          type: 'text'
        }
      },
      type: 'fieldset'
    }
  }

  public async handle (data: ViewGetHandlerData, response: ServerResponse): Promise<string> {
    const view = await this.database?.select<View & ViewGroup & ViewUser, View>(sql`
      SELECT $[snippet]
      FROM $[view]
      JOIN $[view_group] USING ($[view_id])
      WHERE
        $[name] = $(name) AND
        $[view_group.group_id] = $(group_id)
      UNION
      SELECT $[snippet]
      FROM $[view]
      JOIN $[view_user] USING ($[view_id])
      WHERE
        $[name] = $(name) AND
        $[view_user.user_id] = $(user_id)
    `, {
      group_id: data.user?.group_id ?? 0,
      name: data.query.name,
      user_id: data.user?.user_id ?? 0
    })

    if (view === undefined) {
      response.statusCode = 404
      throw new Error('View is undefined')
    }

    response.setHeader('content-type', 'text/html')
    return view.snippet ?? ''
  }
}
