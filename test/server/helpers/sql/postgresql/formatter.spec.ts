import { createADeleteQuery, createASelectAllQueryWithForeignKeysWithCursor, createASelectAllQueryWithForeignKeysWithForeignKey, createASelectAllQueryWithForeignKeysWithSearch, createASelectAllQueryWithForeignKeysWithSort, createASelectAllQueryWithForeignKeysWithoutParameters, createASelectAllQueryWithRelatedKeysWithCursor, createASelectAllQueryWithRelatedKeysWithSearch, createASelectAllQueryWithRelatedKeysWithSort, createASelectAllQueryWithRelatedKeysWithoutParameters, createASelectAllQueryWithoutKeysWithCursor, createASelectAllQueryWithoutKeysWithSearch, createASelectAllQueryWithoutKeysWithSort, createASelectAllQueryWithoutKeysWithoutParameters, createASelectQuery, createAnInsertQuery, createAnUpdatePartialQuery, createAnUpdateQuery } from '../formatter.spec'
import { PostgresqlFormatter } from '../../../../../src/server/helpers/sql/postgresql'
import { expect } from 'chai'

const formatter = new PostgresqlFormatter()

const expectations = {
  formatADeleteQuery: {
    string: 'DELETE FROM $[contact] WHERE $[contact_id] = $(contact_id)',
    values: {
      contact_id: 1
    }
  },
  formatASelectQuery: {
    string: [
      'SELECT $[address].* FROM $[address] JOIN $[case_address] ON $[address.address_id] = $[case_address.address_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE ($[address.address_id] = $(address_address_id)) AND $[case_group.group_id] = $(case_group_group_id)',
      'SELECT $[address].* FROM $[address] JOIN $[case_address] ON $[address.address_id] = $[case_address.address_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE ($[address.address_id] = $(address_address_id)) AND $[case_user.user_id] = $(case_user_user_id)'
    ].join(' UNION '),
    values: {
      address_address_id: 1,
      case_group_group_id: 1,
      case_user_user_id: 1
    }
  },
  formatAnInsertQuery: {
    string: 'INSERT INTO $[contact] ($[family_name],$[given_name]) VALUES ($(family_name),$(given_name))',
    values: {
      family_name: 'sql',
      given_name: 'scola'
    }
  },
  formatAnUpdatePartialQuery: {
    string: 'UPDATE $[contact] SET $[family_name] = $(family_name) WHERE $[contact_id] = $(contact_id)',
    values: {
      contact_id: 1,
      family_name: 'sql'
    }
  },
  formatAnUpdateQuery: {
    string: 'UPDATE $[contact] SET $[family_name] = $(family_name),$[given_name] = $(given_name) WHERE $[contact_id] = $(contact_id)',
    values: {
      contact_id: 1,
      family_name: 'sql',
      given_name: 'scola'
    }
  }
}

const foreignKeysExpectations = {
  withCursor: {
    string: [
      [
        'SELECT $[contact_address].*, $[address].*, $[contact].* FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[contact] ON $[contact_address.contact_id] = $[contact.contact_id] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[cursor] > $(cursor) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address].*, $[address].*, $[contact].* FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[contact] ON $[contact_address.contact_id] = $[contact.contact_id] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[cursor] > $(cursor) AND $[case_user.user_id] = $(case_user_user_id)',
        'SELECT $[contact_address].*, $[address].*, $[contact].* FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[contact] ON $[contact_address.contact_id] = $[contact.contact_id] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_group] ON $[case_contact.case_id] = $[case_group.case_id] WHERE $[cursor] > $(cursor) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address].*, $[address].*, $[contact].* FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[contact] ON $[contact_address.contact_id] = $[contact.contact_id] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_user] ON $[case_contact.case_id] = $[case_user.case_id] WHERE $[cursor] > $(cursor) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY $[cursor] ASC',
      'LIMIT $(count) OFFSET 0'
    ].join(' '),
    values: {
      case_group_group_id: 1,
      case_user_user_id: 1,
      count: 10,
      cursor: 'scola'
    }
  },
  withForeignKey: {
    string: [
      [
        'SELECT $[contact_address].*, $[address].* FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[case_address] ON $[address.address_id] = $[case_address.address_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[contact_address.contact_id] = $(contact_address_contact_id) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address].*, $[address].* FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[case_address] ON $[address.address_id] = $[case_address.address_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[contact_address.contact_id] = $(contact_address_contact_id) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY 1',
      'LIMIT $(count) OFFSET $(offset)'
    ].join(' '),
    values: {
      case_group_group_id: 1,
      case_user_user_id: 1,
      contact_address_contact_id: 1,
      count: 10,
      offset: 0
    }
  },
  withSearch: {
    string: [
      [
        'SELECT $[contact_address].*, $[address].*, $[contact].* FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[contact] ON $[contact_address.contact_id] = $[contact.contact_id] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE ($[contact_address.begin] LIKE $(contact_address_begin_0)) OR ($[address.address_line1] LIKE $(address_address_line1_0)) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address].*, $[address].*, $[contact].* FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[contact] ON $[contact_address.contact_id] = $[contact.contact_id] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE ($[contact_address.begin] LIKE $(contact_address_begin_0)) OR ($[address.address_line1] LIKE $(address_address_line1_0)) AND $[case_user.user_id] = $(case_user_user_id)',
        'SELECT $[contact_address].*, $[address].*, $[contact].* FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[contact] ON $[contact_address.contact_id] = $[contact.contact_id] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_group] ON $[case_contact.case_id] = $[case_group.case_id] WHERE ($[contact_address.begin] LIKE $(contact_address_begin_0)) OR ($[address.address_line1] LIKE $(address_address_line1_0)) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address].*, $[address].*, $[contact].* FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[contact] ON $[contact_address.contact_id] = $[contact.contact_id] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_user] ON $[case_contact.case_id] = $[case_user.case_id] WHERE ($[contact_address.begin] LIKE $(contact_address_begin_0)) OR ($[address.address_line1] LIKE $(address_address_line1_0)) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY 1',
      'LIMIT $(count) OFFSET $(offset)'
    ].join(' '),
    values: {
      address_address_line1_0: 'scola',
      case_group_group_id: 1,
      case_user_user_id: 1,
      contact_address_begin_0: 'scola',
      count: 10,
      offset: 0
    }
  },
  withSort: {
    string: [
      [
        'SELECT $[contact_address].*, $[address].*, $[contact].* FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[contact] ON $[contact_address.contact_id] = $[contact.contact_id] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address].*, $[address].*, $[contact].* FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[contact] ON $[contact_address.contact_id] = $[contact.contact_id] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[case_user.user_id] = $(case_user_user_id)',
        'SELECT $[contact_address].*, $[address].*, $[contact].* FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[contact] ON $[contact_address.contact_id] = $[contact.contact_id] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_group] ON $[case_contact.case_id] = $[case_group.case_id] WHERE $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address].*, $[address].*, $[contact].* FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[contact] ON $[contact_address.contact_id] = $[contact.contact_id] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_user] ON $[case_contact.case_id] = $[case_user.case_id] WHERE $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY 1',
      'LIMIT $(count) OFFSET $(offset)'
    ].join(' '),
    values: {
      case_group_group_id: 1,
      case_user_user_id: 1,
      count: 10,
      offset: 0
    }
  },
  withoutParameters: {
    string: [
      [
        'SELECT $[contact_address].*, $[address].*, $[contact].* FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[contact] ON $[contact_address.contact_id] = $[contact.contact_id] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address].*, $[address].*, $[contact].* FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[contact] ON $[contact_address.contact_id] = $[contact.contact_id] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[case_user.user_id] = $(case_user_user_id)',
        'SELECT $[contact_address].*, $[address].*, $[contact].* FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[contact] ON $[contact_address.contact_id] = $[contact.contact_id] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_group] ON $[case_contact.case_id] = $[case_group.case_id] WHERE $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address].*, $[address].*, $[contact].* FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[contact] ON $[contact_address.contact_id] = $[contact.contact_id] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_user] ON $[case_contact.case_id] = $[case_user.case_id] WHERE $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY 1',
      'LIMIT $(count) OFFSET $(offset)'
    ].join(' '),
    values: {
      case_group_group_id: 1,
      case_user_user_id: 1,
      count: 10,
      offset: 0
    }
  }
}

const relatedKeysExpectations = {
  withCursor: {
    string: [
      [
        'SELECT $[address].* FROM $[address] JOIN $[case_address] ON $[address.case_id] = $[case_address.case_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[case_address.case_id] = $(case_address_case_id) AND $[cursor] > $(cursor) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[address].* FROM $[address] JOIN $[case_address] ON $[address.case_id] = $[case_address.case_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[case_address.case_id] = $(case_address_case_id) AND $[cursor] > $(cursor) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY $[cursor] ASC',
      'LIMIT $(count) OFFSET 0'
    ].join(' '),
    values: {
      case_address_case_id: 1,
      case_group_group_id: 1,
      case_user_user_id: 1,
      count: 10,
      cursor: 'scola'
    }
  },
  withSearch: {
    string: [
      [
        'SELECT $[address].* FROM $[address] JOIN $[case_address] ON $[address.case_id] = $[case_address.case_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[case_address.case_id] = $(case_address_case_id) AND ($[address.address_line1] LIKE $(address_address_line1_0)) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[address].* FROM $[address] JOIN $[case_address] ON $[address.case_id] = $[case_address.case_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[case_address.case_id] = $(case_address_case_id) AND ($[address.address_line1] LIKE $(address_address_line1_0)) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY 1',
      'LIMIT $(count) OFFSET $(offset)'
    ].join(' '),
    values: {
      address_address_line1_0: 'scola',
      case_address_case_id: 1,
      case_group_group_id: 1,
      case_user_user_id: 1,
      count: 10,
      offset: 0
    }
  },
  withSort: {
    string: [
      [
        'SELECT $[address].* FROM $[address] JOIN $[case_address] ON $[address.case_id] = $[case_address.case_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[case_address.case_id] = $(case_address_case_id) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[address].* FROM $[address] JOIN $[case_address] ON $[address.case_id] = $[case_address.case_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[case_address.case_id] = $(case_address_case_id) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY $[address.address_line1] DESC',
      'LIMIT $(count) OFFSET $(offset)'
    ].join(' '),
    values: {
      case_address_case_id: 1,
      case_group_group_id: 1,
      case_user_user_id: 1,
      count: 10,
      offset: 0
    }
  },
  withoutParameters: {
    string: [
      [
        'SELECT $[address].* FROM $[address] JOIN $[case_address] ON $[address.case_id] = $[case_address.case_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[case_address.case_id] = $(case_address_case_id) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[address].* FROM $[address] JOIN $[case_address] ON $[address.case_id] = $[case_address.case_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[case_address.case_id] = $(case_address_case_id) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY 1',
      'LIMIT $(count) OFFSET $(offset)'
    ].join(' '),
    values: {
      case_address_case_id: 1,
      case_group_group_id: 1,
      case_user_user_id: 1,
      count: 10,
      offset: 0
    }
  }
}

const withoutKeysExpectations = {
  withCursor: {
    string: [
      [
        'SELECT $[case].* FROM $[case] JOIN $[case_group] ON $[case.case_id] = $[case_group.case_id] WHERE $[cursor] > $(cursor) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[case].* FROM $[case] JOIN $[case_user] ON $[case.case_id] = $[case_user.case_id] WHERE $[cursor] > $(cursor) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY $[cursor] ASC',
      'LIMIT $(count) OFFSET 0'
    ].join(' '),
    values: {
      case_group_group_id: 1,
      case_user_user_id: 1,
      count: 10,
      cursor: 'scola'
    }
  },
  withSearch: {
    string: [
      [
        'SELECT $[case].* FROM $[case] JOIN $[case_group] ON $[case.case_id] = $[case_group.case_id] WHERE ($[case.name] LIKE $(case_name_0)) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[case].* FROM $[case] JOIN $[case_user] ON $[case.case_id] = $[case_user.case_id] WHERE ($[case.name] LIKE $(case_name_0)) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY 1',
      'LIMIT $(count) OFFSET $(offset)'
    ].join(' '),
    values: {
      case_group_group_id: 1,
      case_name_0: 'scola',
      case_user_user_id: 1,
      count: 10,
      offset: 0
    }
  },
  withSort: {
    string: [
      [
        'SELECT $[case].* FROM $[case] JOIN $[case_group] ON $[case.case_id] = $[case_group.case_id] WHERE $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[case].* FROM $[case] JOIN $[case_user] ON $[case.case_id] = $[case_user.case_id] WHERE $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY $[case.name] DESC',
      'LIMIT $(count) OFFSET $(offset)'
    ].join(' '),
    values: {
      case_group_group_id: 1,
      case_user_user_id: 1,
      count: 10,
      offset: 0
    }
  },
  withoutParameters: {
    string: [
      [
        'SELECT $[case].* FROM $[case] JOIN $[case_group] ON $[case.case_id] = $[case_group.case_id] WHERE $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[case].* FROM $[case] JOIN $[case_user] ON $[case.case_id] = $[case_user.case_id] WHERE $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY 1',
      'LIMIT $(count) OFFSET $(offset)'
    ].join(' '),
    values: {
      case_group_group_id: 1,
      case_user_user_id: 1,
      count: 10,
      offset: 0
    }
  }
}

describe('PostgresqlFormatter', () => {
  describe('should fail to', () => {
    it('format a query with an undefined parameter', formatAQueryWithAnUndefinedParameter)
  })

  describe('should', () => {
    it('format a query', formatAQuery)
    it('format a query for bulk insert', formatAQueryForBulkInsert)

    describe('format a select all query', () => {
      describe('with foreign keys', () => {
        it('with cursor', createASelectAllQueryWithForeignKeysWithCursor.bind(null, formatter, foreignKeysExpectations))
        it('with foreign key', createASelectAllQueryWithForeignKeysWithForeignKey.bind(null, formatter, foreignKeysExpectations))
        it('with search', createASelectAllQueryWithForeignKeysWithSearch.bind(null, formatter, foreignKeysExpectations))
        it('with sort', createASelectAllQueryWithForeignKeysWithSort.bind(null, formatter, foreignKeysExpectations))
        it('without parameters', createASelectAllQueryWithForeignKeysWithoutParameters.bind(null, formatter, foreignKeysExpectations))
      })

      describe('with related keys', () => {
        it('with cursor', createASelectAllQueryWithRelatedKeysWithCursor.bind(null, formatter, relatedKeysExpectations))
        it('with search', createASelectAllQueryWithRelatedKeysWithSearch.bind(null, formatter, relatedKeysExpectations))
        it('with sort', createASelectAllQueryWithRelatedKeysWithSort.bind(null, formatter, relatedKeysExpectations))
        it('without parameters', createASelectAllQueryWithRelatedKeysWithoutParameters.bind(null, formatter, relatedKeysExpectations))
      })

      describe('without keys', () => {
        it('with cursor', createASelectAllQueryWithoutKeysWithCursor.bind(null, formatter, withoutKeysExpectations))
        it('with search', createASelectAllQueryWithoutKeysWithSearch.bind(null, formatter, withoutKeysExpectations))
        it('with sort', createASelectAllQueryWithoutKeysWithSort.bind(null, formatter, withoutKeysExpectations))
        it('without parameters', createASelectAllQueryWithoutKeysWithoutParameters.bind(null, formatter, withoutKeysExpectations))
      })
    })

    it('format an delete query', createADeleteQuery.bind(null, formatter, expectations))
    it('format an insert query', createAnInsertQuery.bind(null, formatter, expectations))
    it('format a select query', createASelectQuery.bind(null, formatter, expectations))
    it('format an update query', createAnUpdateQuery.bind(null, formatter, expectations))
    it('format an update partial query', createAnUpdatePartialQuery.bind(null, formatter, expectations))
  })
})

function formatAQuery (): void {
  const expectedQuery = `
    SELECT *
    FROM "scola"."test_connection"
    WHERE
      "test" = NULL AND
      "test" = NULL AND
      "test" = 't' AND
      "test" = 1 AND
      "test" = '1' AND
      "test" = '1' AND
      "test" = '{"number":3}'::jsonb
  `

  const rawString = `
    SELECT *
    FROM $[scola.test_connection]
    WHERE
      $[test] = $(test1) AND
      $[test] = $(test2) AND
      $[test] = $(test3) AND
      $[test] = $(test4) AND
      $[test] = $(test5) AND
      $[test] = $(test5) AND
      $[test] = $(test6)
  `

  const rawValues = {
    test1: null,
    test2: undefined,
    test3: true,
    test4: 1,
    test5: '1',
    test6: {
      number: 3
    }
  }

  expect(formatter.formatQuery({
    string: rawString,
    values: rawValues
  })).equal(expectedQuery)
}

function formatAQueryForBulkInsert (): void {
  const expectedQuery = `
    INSERT INTO test_connection (name)
    VALUES ('name1'), ('name2')
  `

  const string = `
    INSERT INTO test_connection (name)
    VALUES $(list)
  `

  const values = {
    list: [
      ['name1'],
      ['name2']
    ]
  }

  expect(formatter.formatQuery({
    string,
    values
  })).equal(expectedQuery)
}

function formatAQueryWithAnUndefinedParameter (): void {
  const string = `
    SELECT *
    FROM test_connection
    WHERE test = $(test1)
  `

  const values = {
    test2: 2
  }

  try {
    formatter.formatQuery({
      string,
      values
    })
  } catch (error: unknown) {
    expect(String(error)).match(/Parameter "test1" is undefined/u)
  }
}
