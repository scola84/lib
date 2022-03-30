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
  ],
  search: [
    {
      column: 'begin',
      table: 'contact_address'
    },
    {
      column: 'address_line1',
      table: 'address'
    },
    {
      column: 'family_name',
      table: 'contact'
    }
  ],
  sort: [
    {
      column: 'end',
      table: 'contact_address'
    },
    {
      column: 'address_line1',
      table: 'address'
    },
    {
      column: 'family_name',
      table: 'contact'
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
  ],
  search: [
    {
      column: 'address_line1',
      table: 'address'
    }
  ],
  sort: [
    {
      column: 'address_line1',
      table: 'address'
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
  ],
  search: [
    {
      column: 'name',
      table: 'case'
    }
  ],
  sort: [
    {
      column: 'name',
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
    contact_id: 1,
    limit: 10
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.withForeignKey.string)
  expect(values).eql(expectations.withForeignKey.values)
}

export function createASelectAllQueryWithForeignKeysWithSearch (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createSelectAllQuery('contact_address', withForeignKeys, withForeignKeys.primary ?? [], {
    limit: 10,
    search: 'scola% contact_address.begin:>2020-01-01'
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.withSearch.string)
  expect(values).eql(expectations.withSearch.values)
}

export function createASelectAllQueryWithForeignKeysWithSort (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createSelectAllQuery('contact_address', withForeignKeys, withForeignKeys.primary ?? [], {
    direction: 'desc',
    limit: 10,
    order: 'case.name'
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.withSort.string)
  expect(values).eql(expectations.withSort.values)
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
    case_id: 1,
    cursor: 'scola',
    limit: 10
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.withCursor.string)
  expect(values).eql(expectations.withCursor.values)
}

export function createASelectAllQueryWithRelatedKeysWithSearch (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createSelectAllQuery('address', withRelatedKeys, withRelatedKeys.related ?? [], {
    case_id: 1,
    limit: 10,
    search: 'scola lib'
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.withSearch.string)
  expect(values).eql(expectations.withSearch.values)
}

export function createASelectAllQueryWithRelatedKeysWithSort (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createSelectAllQuery('address', withRelatedKeys, withRelatedKeys.related ?? [], {
    case_id: 1,
    direction: 'desc',
    limit: 10,
    order: 'address.address_line1'
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.withSort.string)
  expect(values).eql(expectations.withSort.values)
}

export function createASelectAllQueryWithRelatedKeysWithoutParameters (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createSelectAllQuery('address', withRelatedKeys, withRelatedKeys.related ?? [], {
    case_id: 1,
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

export function createASelectAllQueryWithoutKeysWithSearch (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createSelectAllQuery('case', withoutKeys, withoutKeys.primary ?? [], {
    limit: 10,
    search: 'scola lib'
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.withSearch.string)
  expect(values).eql(expectations.withSearch.values)
}

export function createASelectAllQueryWithoutKeysWithSort (formatter: SqlFormatter, expectations: Struct<Struct>): void {
  const {
    string,
    values
  } = formatter.createSelectAllQuery('case', withoutKeys, withoutKeys.primary ?? [], {
    direction: 'desc',
    limit: 10,
    order: 'case.name'
  }, user as User)

  expect(formatter.sanitizeQuery(string)).eq(expectations.withSort.string)
  expect(values).eql(expectations.withSort.values)
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
  } = formatter.createInsertQuery('contact', keys, {
    family_name: {
      type: 'text'
    },
    given_name: {
      type: 'text'
    }
  }, {
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
