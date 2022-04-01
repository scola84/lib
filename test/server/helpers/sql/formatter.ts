import type { SqlFormatter } from '../../../../src/server/helpers/sql/formatter'
import type { SqlQueryKeys } from '../../../../src/server/helpers/sql/query'
import type { Struct } from '../../../../src/common'
import type { User } from '../../../../src/server/entities'
import { expect } from 'chai'

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

const user: Partial<User> = {
  group_id: 1,
  user_id: 1
}

export function createASelectQuery (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createSelectQuery('address', keys.select, keys.select.primary ?? [], {
    address_id: 1
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.formatASelectQuery.string)
  expect(values).eql(expectations.formatASelectQuery.values)
}

export function createASelectAllQueryWithForeignKeysWithCursor (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createSelectAllQuery('contact_address', withForeignKeys, withForeignKeys.primary ?? [], {
    cursor: 'scola',
    limit: 10
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.withCursor.string)
  expect(values).eql(expectations.withCursor.values)
}

export function createASelectAllQueryWithForeignKeysWithForeignKey (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const authKeys = withForeignKeys.foreign?.filter((key) => {
    return key.table !== 'contact'
  }) ?? []

  const {
    string,
    values
  } = formatter.createSelectAllQuery('contact_address', withForeignKeys, authKeys, {
    join: {
      contact: {
        contact_id: 1
      }
    },
    limit: 10
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.withForeignKey.string)
  expect(values).eql(expectations.withForeignKey.values)
}

export function createASelectAllQueryWithForeignKeysWithWhere (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createSelectAllQuery('contact_address', withForeignKeys, withForeignKeys.primary ?? [], {
    limit: 10,
    where: {
      contact_address: {
        begin: '>2020-01-01'
      }
    }
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.withWhere.string)
  expect(values).eql(expectations.withWhere.values)
}

export function createASelectAllQueryWithForeignKeysWithOrder (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createSelectAllQuery('contact_address', withForeignKeys, withForeignKeys.primary ?? [], {
    limit: 10,
    order: [
      'contact_address.begin>'
    ]
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.withOrder.string)
  expect(values).eql(expectations.withOrder.values)
}

export function createASelectAllQueryWithForeignKeysWithoutParameters (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createSelectAllQuery('contact_address', withForeignKeys, withForeignKeys.primary ?? [], {
    limit: 10
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.withoutParameters.string)
  expect(values).eql(expectations.withoutParameters.values)
}

export function createASelectAllQueryWithRelatedKeysWithCursor (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createSelectAllQuery('address', withRelatedKeys, withRelatedKeys.related ?? [], {
    cursor: 'scola',
    join: {
      case_address: {
        case_id: 1
      }
    },
    limit: 10
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.withCursor.string)
  expect(values).eql(expectations.withCursor.values)
}

export function createASelectAllQueryWithRelatedKeysWithWhere (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createSelectAllQuery('address', withRelatedKeys, withRelatedKeys.related ?? [], {
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
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.withWhere.string)
  expect(values).eql(expectations.withWhere.values)
}

export function createASelectAllQueryWithRelatedKeysWithOrder (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createSelectAllQuery('address', withRelatedKeys, withRelatedKeys.related ?? [], {
    join: {
      case_address: {
        case_id: 1
      }
    },
    limit: 10,
    order: [
      'address.address_line1>'
    ]
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.withOrder.string)
  expect(values).eql(expectations.withOrder.values)
}

export function createASelectAllQueryWithRelatedKeysWithoutParameters (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createSelectAllQuery('address', withRelatedKeys, withRelatedKeys.related ?? [], {
    join: {
      case_address: {
        case_id: 1
      }
    },
    limit: 10
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.withoutParameters.string)
  expect(values).eql(expectations.withoutParameters.values)
}

export function createASelectAllQueryWithoutKeysWithCursor (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createSelectAllQuery('case', withoutKeys, withoutKeys.primary ?? [], {
    cursor: 'scola',
    limit: 10
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.withCursor.string)
  expect(values).eql(expectations.withCursor.values)
}

export function createASelectAllQueryWithoutKeysWithWhere (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createSelectAllQuery('case', withoutKeys, withoutKeys.primary ?? [], {
    limit: 10,
    where: {
      case: {
        name: '%scola'
      }
    }
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.withWhere.string)
  expect(values).eql(expectations.withWhere.values)
}

export function createASelectAllQueryWithoutKeysWithOrder (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createSelectAllQuery('case', withoutKeys, withoutKeys.primary ?? [], {
    limit: 10,
    order: [
      'case.name>'
    ]
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.withOrder.string)
  expect(values).eql(expectations.withOrder.values)
}

export function createASelectAllQueryWithoutKeysWithoutParameters (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createSelectAllQuery('case', withoutKeys, withoutKeys.primary ?? [], {
    limit: 10
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.withoutParameters.string)
  expect(values).eql(expectations.withoutParameters.values)
}

export function createADeleteQuery (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createDeleteQuery('contact', updateKeys, {
    contact_id: 1
  })

  expect(formatter.sanitizeQuery(string)).eq(expectations.formatADeleteQuery.string)
  expect(values).eql(expectations.formatADeleteQuery.values)
}

export function createAnInsertQuery (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createInsertQuery('contact', {
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

  expect(formatter.sanitizeQuery(string)).eq(expectations.formatAnInsertQuery.string)
  expect(values).eql(expectations.formatAnInsertQuery.values)
}

const updateKeys: SqlQueryKeys = {
  primary: [
    {
      column: 'contact_id',
      table: 'contact'
    }
  ]
}

export function createAnUpdateQuery (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createUpdateQuery('contact', updateKeys, {
    family_name: {
      type: 'text'
    },
    given_name: {
      type: 'text'
    }
  }, {
    contact_id: 1,
    family_name: 'sql',
    given_name: 'scola'
  })

  expect(formatter.sanitizeQuery(string)).eq(expectations.formatAnUpdateQuery.string)
  expect(values).eql(expectations.formatAnUpdateQuery.values)
}
