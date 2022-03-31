import { createADeleteQuery, createASelectAllQueryWithForeignKeysWithCursor, createASelectAllQueryWithForeignKeysWithForeignKey, createASelectAllQueryWithForeignKeysWithOrder, createASelectAllQueryWithForeignKeysWithWhere, createASelectAllQueryWithForeignKeysWithoutParameters, createASelectAllQueryWithRelatedKeysWithCursor, createASelectAllQueryWithRelatedKeysWithOrder, createASelectAllQueryWithRelatedKeysWithWhere, createASelectAllQueryWithRelatedKeysWithoutParameters, createASelectAllQueryWithoutKeysWithCursor, createASelectAllQueryWithoutKeysWithOrder, createASelectAllQueryWithoutKeysWithWhere, createASelectAllQueryWithoutKeysWithoutParameters, createASelectQuery, createAnInsertQuery, createAnUpdateQuery } from '../formatter'
import { MysqlFormatter } from '../../../../../src/server/helpers/sql/mysql'
import { expect } from 'chai'

const formatter = new MysqlFormatter()

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
        'SELECT $[contact_address].* FROM $[contact_address] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[cursor] > $(cursor) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address].* FROM $[contact_address] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[cursor] > $(cursor) AND $[case_user.user_id] = $(case_user_user_id)',
        'SELECT $[contact_address].* FROM $[contact_address] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_group] ON $[case_contact.case_id] = $[case_group.case_id] WHERE $[cursor] > $(cursor) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address].* FROM $[contact_address] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_user] ON $[case_contact.case_id] = $[case_user.case_id] WHERE $[cursor] > $(cursor) AND $[case_user.user_id] = $(case_user_user_id)'
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
        'SELECT $[contact_address].* FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[case_address] ON $[address.address_id] = $[case_address.address_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[contact_address.contact_id] = $(contact_address_contact_id) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address].* FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[case_address] ON $[address.address_id] = $[case_address.address_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[contact_address.contact_id] = $(contact_address_contact_id) AND $[case_user.user_id] = $(case_user_user_id)'
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
  withOrder: {
    string: [
      [
        'SELECT $[contact_address].* FROM $[contact_address] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address].* FROM $[contact_address] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[case_user.user_id] = $(case_user_user_id)',
        'SELECT $[contact_address].* FROM $[contact_address] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_group] ON $[case_contact.case_id] = $[case_group.case_id] WHERE $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address].* FROM $[contact_address] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_user] ON $[case_contact.case_id] = $[case_user.case_id] WHERE $[case_user.user_id] = $(case_user_user_id)'
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
  withWhere: {
    string: [
      [
        'SELECT $[contact_address].* FROM $[contact_address] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE ($[contact_address.begin] > $(contact_address_begin)) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address].* FROM $[contact_address] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE ($[contact_address.begin] > $(contact_address_begin)) AND $[case_user.user_id] = $(case_user_user_id)',
        'SELECT $[contact_address].* FROM $[contact_address] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_group] ON $[case_contact.case_id] = $[case_group.case_id] WHERE ($[contact_address.begin] > $(contact_address_begin)) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address].* FROM $[contact_address] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_user] ON $[case_contact.case_id] = $[case_user.case_id] WHERE ($[contact_address.begin] > $(contact_address_begin)) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY 1',
      'LIMIT $(count) OFFSET $(offset)'
    ].join(' '),
    values: {
      case_group_group_id: 1,
      case_user_user_id: 1,
      contact_address_begin: '2020-01-01',
      count: 10,
      offset: 0
    }
  },
  withoutParameters: {
    string: [
      [
        'SELECT $[contact_address].* FROM $[contact_address] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address].* FROM $[contact_address] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[case_user.user_id] = $(case_user_user_id)',
        'SELECT $[contact_address].* FROM $[contact_address] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_group] ON $[case_contact.case_id] = $[case_group.case_id] WHERE $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address].* FROM $[contact_address] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_user] ON $[case_contact.case_id] = $[case_user.case_id] WHERE $[case_user.user_id] = $(case_user_user_id)'
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
  withOrder: {
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
  withWhere: {
    string: [
      [
        'SELECT $[address].* FROM $[address] JOIN $[case_address] ON $[address.case_id] = $[case_address.case_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[case_address.case_id] = $(case_address_case_id) AND ($[address.address_line1] = $(address_address_line1)) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[address].* FROM $[address] JOIN $[case_address] ON $[address.case_id] = $[case_address.case_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[case_address.case_id] = $(case_address_case_id) AND ($[address.address_line1] = $(address_address_line1)) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY 1',
      'LIMIT $(count) OFFSET $(offset)'
    ].join(' '),
    values: {
      address_address_line1: 'scola',
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
  withOrder: {
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
  withWhere: {
    string: [
      [
        'SELECT $[case].* FROM $[case] JOIN $[case_group] ON $[case.case_id] = $[case_group.case_id] WHERE ($[case.name] = $(case_name)) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[case].* FROM $[case] JOIN $[case_user] ON $[case.case_id] = $[case_user.case_id] WHERE ($[case.name] = $(case_name)) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY 1',
      'LIMIT $(count) OFFSET $(offset)'
    ].join(' '),
    values: {
      case_group_group_id: 1,
      case_name: 'scola',
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

describe('MysqlFormatter', () => {
  describe('should fail to', () => {
    it('format a query with an undefined parameter', formatAQueryWithAnUndefinedParameter)
  })

  describe('should', () => {
    it('format a query', formatAQuery)
    it('format a query for bulk insert', formatAQueryForBulkInsert)
    it('format a query with escaped identifiers', formatAQueryWithEscapedIdentifiers)
    it('format a query with escaped parameters', formatAQueryWithEscapedParameters)

    describe('format a select all query with', () => {
      describe('foreign keys', () => {
        it('with cursor', createASelectAllQueryWithForeignKeysWithCursor.bind(null, formatter, foreignKeysExpectations))
        it('with foreign key', createASelectAllQueryWithForeignKeysWithForeignKey.bind(null, formatter, foreignKeysExpectations))
        it('with order', createASelectAllQueryWithForeignKeysWithOrder.bind(null, formatter, foreignKeysExpectations))
        it('with where', createASelectAllQueryWithForeignKeysWithWhere.bind(null, formatter, foreignKeysExpectations))
        it('without parameters', createASelectAllQueryWithForeignKeysWithoutParameters.bind(null, formatter, foreignKeysExpectations))
      })

      describe('related keys', () => {
        it('with cursor', createASelectAllQueryWithRelatedKeysWithCursor.bind(null, formatter, relatedKeysExpectations))
        it('with order', createASelectAllQueryWithRelatedKeysWithOrder.bind(null, formatter, relatedKeysExpectations))
        it('with where', createASelectAllQueryWithRelatedKeysWithWhere.bind(null, formatter, relatedKeysExpectations))
        it('without parameters', createASelectAllQueryWithRelatedKeysWithoutParameters.bind(null, formatter, relatedKeysExpectations))
      })

      describe('no keys', () => {
        it('with cursor', createASelectAllQueryWithoutKeysWithCursor.bind(null, formatter, withoutKeysExpectations))
        it('with order', createASelectAllQueryWithoutKeysWithOrder.bind(null, formatter, withoutKeysExpectations))
        it('with where', createASelectAllQueryWithoutKeysWithWhere.bind(null, formatter, withoutKeysExpectations))
        it('without parameters', createASelectAllQueryWithoutKeysWithoutParameters.bind(null, formatter, withoutKeysExpectations))
      })
    })

    it('format a delete query', createADeleteQuery.bind(null, formatter, expectations))
    it('format a select query', createASelectQuery.bind(null, formatter, expectations))
    it('format an insert query', createAnInsertQuery.bind(null, formatter, expectations))
    it('format an update query', createAnUpdateQuery.bind(null, formatter, expectations))
  })
})

function formatAQuery (): void {
  const expectedQuery = `
    SELECT *
    FROM \`scola\`.\`test_connection\`
    WHERE
      \`test\` = NULL AND
      \`test\` = NULL AND
      \`test\` = true AND
      \`test\` = 1 AND
      \`test\` = '1' AND
      \`test\` = '1' AND
      \`test\` = '{\\"number\\":3}'
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
  })).eq(expectedQuery)
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
  })).eq(expectedQuery)
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

function formatAQueryWithEscapedIdentifiers (): void {
  const expectedQuery = `
    SELECT '$[0]'
    FROM test
  `

  const rawString = `
    SELECT '\\$[0]'
    FROM test
  `

  expect(formatter.formatQuery({
    string: rawString
  })).eq(expectedQuery)
}

function formatAQueryWithEscapedParameters (): void {
  const expectedQuery = `
    SELECT '$(0)'
    FROM test
  `

  const rawString = `
    SELECT '\\$(0)'
    FROM test
  `

  expect(formatter.formatQuery({
    string: rawString
  })).eq(expectedQuery)
}
