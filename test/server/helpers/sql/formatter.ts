import type { SqlQuery, SqlQueryKeys } from '../../../../src/server/helpers/sql/query'
import type { Schema } from '../../../../src/server/helpers/schema'
import type { SqlFormatter } from '../../../../src/server/helpers/sql/formatter'
import type { Struct } from '../../../../src/common'
import type { User } from '../../../../src/server/entities'
import { createUser } from '../../../../src/server/entities'

const keys: Struct<SqlQueryKeys> = {
  select: {
    auth: {
      address_id: [
        [
          {
            column: 'case_id',
            table: 'case_address'
          },
          {
            column: 'group_id',
            table: 'case_group'
          }
        ],
        [
          {
            column: 'case_id',
            table: 'case_address'
          },
          {
            column: 'user_id',
            table: 'case_user'
          }
        ]
      ],
      case_id: [
        [
          {
            column: 'group_id',
            table: 'case_group'
          }
        ],
        [
          {
            column: 'user_id',
            table: 'case_user'
          }
        ]
      ]
    },
    primary: [
      {
        column: 'address_id',
        table: 'address'
      }
    ],
    related: [
      {
        column: 'case_id',
        table: 'case_address'
      }
    ]
  }
}

const withForeignKeys: SqlQueryKeys = {
  auth: {
    address_id: [
      [
        {
          column: 'case_id',
          table: 'case_address'
        },
        {
          column: 'group_id',
          table: 'case_group'
        }
      ],
      [
        {
          column: 'case_id',
          table: 'case_address'
        },
        {
          column: 'user_id',
          table: 'case_user'
        }
      ]
    ],
    contact_id: [
      [
        {
          column: 'case_id',
          table: 'case_contact'
        },
        {
          column: 'group_id',
          table: 'case_group'
        }
      ],
      [
        {
          column: 'case_id',
          table: 'case_contact'
        },
        {
          column: 'user_id',
          table: 'case_user'
        }
      ]
    ]
  },
  foreign: [
    {
      column: 'address_id',
      table: 'address'
    },
    {
      column: 'contact_id',
      table: 'contact'
    }
  ],
  primary: [
    {
      column: 'address_id',
      table: 'contact_address'
    },
    {
      column: 'contact_id',
      table: 'contact_address'
    }
  ]
}

const withForeignKeysSchema: Schema = {
  select: {
    schema: {
      contact_address: {
        schema: {
          begin: {
            type: 'datetime-local'
          },
          contact_id: {
            type: 'number'
          }
        },
        strict: true,
        type: 'struct'
      }
    },
    strict: true,
    type: 'struct'
  }
}

const withRelatedKeys: SqlQueryKeys = {
  auth: {
    case_id: [
      [
        {
          column: 'group_id',
          table: 'case_group'
        }
      ],
      [
        {
          column: 'user_id',
          table: 'case_user'
        }
      ]
    ]
  },
  primary: [
    {
      column: 'address_id',
      table: 'address'
    }
  ],
  related: [
    {
      column: 'case_id',
      table: 'case_address'
    }
  ]
}

const withRelatedKeysSchema: Schema = {
  select: {
    schema: {
      address: {
        schema: {
          address_id: {
            type: 'number'
          },
          address_line1: {
            type: 'text'
          }
        },
        strict: true,
        type: 'struct'
      }
    },
    strict: true,
    type: 'struct'
  }
}

const withoutKeys: SqlQueryKeys = {
  auth: {
    case_id: [
      [
        {
          column: 'group_id',
          table: 'case_group'
        }
      ],
      [
        {
          column: 'user_id',
          table: 'case_user'
        }
      ]
    ]
  },
  primary: [
    {
      column: 'case_id',
      table: 'case'
    }
  ]
}

const withoutKeysSchema: Schema = {
  select: {
    schema: {
      case_id: {
        type: 'number'
      },
      name: {
        type: 'text'
      }
    },
    strict: true,
    type: 'struct'
  }
}

const updateKeys: SqlQueryKeys = {
  primary: [
    {
      column: 'contact_id',
      table: 'contact'
    }
  ]
}

const user: User = createUser()

export function callCreateADeleteQuery (formatter: SqlFormatter): SqlQuery {
  return formatter.createDeleteQuery('contact', updateKeys, {
    contact_id: 1
  })
}

export function callCreateASelectQuery (formatter: SqlFormatter): SqlQuery {
  return formatter.createSelectQuery('address', keys.select, keys.select.primary ?? [], {
    where: {
      address_id: 1
    }
  }, user)
}

export function callCreateAnInsertQuery (formatter: SqlFormatter): SqlQuery {
  return formatter.createInsertQuery('contact', {
    family_name: {
      type: 'text'
    },
    given_name: {
      type: 'text'
    }
  }, keys, {
    family_name: 'sql',
    given_name: 'scola'
  })
}

export function callCreateAnUpdateQuery (formatter: SqlFormatter): SqlQuery {
  return formatter.createUpdateQuery('contact', {
    family_name: {
      type: 'text'
    },
    given_name: {
      type: 'text'
    }
  }, updateKeys, {
    contact_id: 1,
    family_name: 'sql',
    given_name: 'scola'
  })
}

export function callCreateASelectAllQueryWithForeignKeysWithCursor (formatter: SqlFormatter): SqlQuery {
  return formatter.createSelectAllQuery('contact_address', withForeignKeysSchema, withForeignKeys, withForeignKeys.primary ?? [], {
    cursor: 'scola',
    limit: 10
  }, user)
}

export function callCreateASelectAllQueryWithForeignKeysWithForeignKey (formatter: SqlFormatter): SqlQuery {
  const authKeys = withForeignKeys.foreign?.filter((key) => {
    return key.table !== 'contact'
  }) ?? []

  return formatter.createSelectAllQuery('contact_address', withForeignKeysSchema, withForeignKeys, authKeys, {
    join: {
      contact: {
        contact_id: 1
      }
    },
    limit: 10
  }, user)
}

export function callCreateASelectAllQueryWithForeignKeysWithOrder (formatter: SqlFormatter): SqlQuery {
  return formatter.createSelectAllQuery('contact_address', withForeignKeysSchema, withForeignKeys, withForeignKeys.primary ?? [], {
    limit: 10,
    order: {
      contact_address: {
        begin: 'DESC'
      }
    }
  }, user)
}

export function callCreateASelectAllQueryWithForeignKeysWithSelect (formatter: SqlFormatter): SqlQuery {
  return formatter.createSelectAllQuery('contact_address', withForeignKeysSchema, withForeignKeys, withForeignKeys.primary ?? [], {
    limit: 10,
    select: {
      contact_address: {
        begin: true
      }
    }
  }, user)
}

export function callCreateASelectAllQueryWithForeignKeysWithWhere (formatter: SqlFormatter): SqlQuery {
  return formatter.createSelectAllQuery('contact_address', withForeignKeysSchema, withForeignKeys, withForeignKeys.primary ?? [], {
    limit: 10,
    operator: {
      contact_address: {
        begin: '>'
      }
    },
    where: {
      contact_address: {
        begin: '2020-01-01'
      }
    }
  }, user)
}

export function callCreateASelectAllQueryWithForeignKeysWithoutParameters (formatter: SqlFormatter): SqlQuery {
  return formatter.createSelectAllQuery('contact_address', withForeignKeysSchema, withForeignKeys, withForeignKeys.primary ?? [], {
    limit: 10
  }, user)
}

export function callCreateASelectAllQueryWithRelatedKeysWithCursor (formatter: SqlFormatter): SqlQuery {
  return formatter.createSelectAllQuery('address', withRelatedKeysSchema, withRelatedKeys, withRelatedKeys.related ?? [], {
    cursor: 'scola',
    join: {
      case_address: {
        case_id: 1
      }
    },
    limit: 10
  }, user)
}

export function callCreateASelectAllQueryWithRelatedKeysWithOrder (formatter: SqlFormatter): SqlQuery {
  return formatter.createSelectAllQuery('address', withRelatedKeysSchema, withRelatedKeys, withRelatedKeys.related ?? [], {
    join: {
      case_address: {
        case_id: 1
      }
    },
    limit: 10,
    order: {
      address: {
        address_line1: 'DESC'
      }
    }
  }, user)
}

export function callCreateASelectAllQueryWithRelatedKeysWithSelect (formatter: SqlFormatter): SqlQuery {
  return formatter.createSelectAllQuery('address', withRelatedKeysSchema, withRelatedKeys, withRelatedKeys.related ?? [], {
    join: {
      case_address: {
        case_id: 1
      }
    },
    limit: 10,
    select: {
      address: {
        address_line1: true
      }
    }
  }, user)
}

export function callCreateASelectAllQueryWithRelatedKeysWithWhere (formatter: SqlFormatter): SqlQuery {
  return formatter.createSelectAllQuery('address', withRelatedKeysSchema, withRelatedKeys, withRelatedKeys.related ?? [], {
    join: {
      case_address: {
        case_id: 1
      }
    },
    limit: 10,
    where: {
      address: {
        address_line1: 'scola'
      }
    }
  }, user)
}

export function callCreateASelectAllQueryWithRelatedKeysWithoutParameters (formatter: SqlFormatter): SqlQuery {
  return formatter.createSelectAllQuery('address', withRelatedKeysSchema, withRelatedKeys, withRelatedKeys.related ?? [], {
    join: {
      case_address: {
        case_id: 1
      }
    },
    limit: 10
  }, user)
}

export function callCreateASelectAllQueryWithoutKeysWithCursor (formatter: SqlFormatter): SqlQuery {
  return formatter.createSelectAllQuery('case', withoutKeysSchema, withoutKeys, withoutKeys.primary ?? [], {
    cursor: 'scola',
    limit: 10
  }, user)
}

export function callCreateASelectAllQueryWithoutKeysWithOrder (formatter: SqlFormatter): SqlQuery {
  return formatter.createSelectAllQuery('case', withoutKeysSchema, withoutKeys, withoutKeys.primary ?? [], {
    limit: 10,
    order: {
      name: 'DESC'
    }
  }, user)
}

export function callCreateASelectAllQueryWithoutKeysWithSelect (formatter: SqlFormatter): SqlQuery {
  return formatter.createSelectAllQuery('case', withoutKeysSchema, withoutKeys, withoutKeys.primary ?? [], {
    limit: 10,
    select: {
      name: true
    }
  }, user)
}

export function callCreateASelectAllQueryWithoutKeysWithoutParameters (formatter: SqlFormatter): SqlQuery {
  return formatter.createSelectAllQuery('case', withoutKeysSchema, withoutKeys, withoutKeys.primary ?? [], {
    limit: 10
  }, user)
}

export function callCreateASelectAllQueryWithoutKeysWithWhere (formatter: SqlFormatter): SqlQuery {
  return formatter.createSelectAllQuery('case', withoutKeysSchema, withoutKeys, withoutKeys.primary ?? [], {
    limit: 10,
    operator: {
      name: 'LIKE'
    },
    where: {
      name: '%scola'
    }
  }, user)
}
