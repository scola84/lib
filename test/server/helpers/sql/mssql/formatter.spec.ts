import { callCreateADeleteQuery, callCreateASelectAllQueryWithForeignKeysWithCursor, callCreateASelectAllQueryWithForeignKeysWithForeignKey, callCreateASelectAllQueryWithForeignKeysWithOrder, callCreateASelectAllQueryWithForeignKeysWithSelect, callCreateASelectAllQueryWithForeignKeysWithWhere, callCreateASelectAllQueryWithForeignKeysWithoutParameters, callCreateASelectAllQueryWithRelatedKeysWithCursor, callCreateASelectAllQueryWithRelatedKeysWithOrder, callCreateASelectAllQueryWithRelatedKeysWithSelect, callCreateASelectAllQueryWithRelatedKeysWithWhere, callCreateASelectAllQueryWithRelatedKeysWithoutParameters, callCreateASelectAllQueryWithoutKeysWithCursor, callCreateASelectAllQueryWithoutKeysWithOrder, callCreateASelectAllQueryWithoutKeysWithSelect, callCreateASelectAllQueryWithoutKeysWithWhere, callCreateASelectAllQueryWithoutKeysWithoutParameters, callCreateASelectQuery, callCreateAnInsertQuery, callCreateAnUpdateQuery } from '../formatter'
import { MssqlFormatter } from '../../../../../src/server/helpers/sql/mssql'
import { expect } from 'chai'

describe('PostgresqlFormatter', () => {
  describe('should fail to', () => {
    it('format a query with an undefined parameter', formatAQueryWithAnUndefinedParameter)
  })

  describe('should', () => {
    it('format a query', formatAQuery)
    it('format a query for bulk insert', formatAQueryForBulkInsert)
    it('format a query with escaped identifiers', formatAQueryWithEscapedIdentifiers)
    it('format a query with escaped parameters', formatAQueryWithEscapedParameters)

    describe('format a select all query', () => {
      describe('with foreign keys', () => {
        it('with cursor', createASelectAllQueryWithForeignKeysWithCursor)
        it('with foreign key', createASelectAllQueryWithForeignKeysWithForeignKey)
        it('with order', createASelectAllQueryWithForeignKeysWithOrder)
        it('with select', createASelectAllQueryWithForeignKeysWithSelect)
        it('with where', createASelectAllQueryWithForeignKeysWithWhere)
        it('without parameters', createASelectAllQueryWithForeignKeysWithoutParameters)
      })

      describe('with related keys', () => {
        it('with cursor', createASelectAllQueryWithRelatedKeysWithCursor)
        it('with order', createASelectAllQueryWithRelatedKeysWithOrder)
        it('with select', createASelectAllQueryWithRelatedKeysWithSelect)
        it('with where', createASelectAllQueryWithRelatedKeysWithWhere)
        it('without parameters', createASelectAllQueryWithRelatedKeysWithoutParameters)
      })

      describe('without keys', () => {
        it('with cursor', createASelectAllQueryWithoutKeysWithCursor)
        it('with order', createASelectAllQueryWithoutKeysWithOrder)
        it('with select', createASelectAllQueryWithoutKeysWithSelect)
        it('with where', createASelectAllQueryWithoutKeysWithWhere)
        it('without parameters', createASelectAllQueryWithoutKeysWithoutParameters)
      })
    })

    it('format a delete query', createADeleteQuery)
    it('format a select query', createASelectQuery)
    it('format an insert query', createAnInsertQuery)
    it('format an update query', createAnUpdateQuery)
  })
})

const formatter = new MssqlFormatter()

function createADeleteQuery (): void {
  const expectedQuery = {
    string: 'DELETE FROM $[contact] WHERE $[contact_id] = $(contact_id)',
    values: {
      contact_id: 1
    }
  }

  const actualQuery = callCreateADeleteQuery(formatter)

  expect(formatter.sanitizeQuery(actualQuery.string)).eq(expectedQuery.string)
  expect(actualQuery.values).eql(expectedQuery.values)
}

function createASelectQuery (): void {
  const expectedQuery = {
    string: [
      'SELECT $[address].* FROM $[address] JOIN $[case_address] ON $[address.address_id] = $[case_address.address_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[address.address_id] = $(address_address_id) AND $[case_group.group_id] = $(case_group_group_id)',
      'SELECT $[address].* FROM $[address] JOIN $[case_address] ON $[address.address_id] = $[case_address.address_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[address.address_id] = $(address_address_id) AND $[case_user.user_id] = $(case_user_user_id)'
    ].join(' UNION '),
    values: {
      address_address_id: 1,
      case_group_group_id: 1,
      case_user_user_id: 1
    }
  }

  const actualQuery = callCreateASelectQuery(formatter)

  expect(formatter.sanitizeQuery(actualQuery.string)).eq(expectedQuery.string)
  expect(actualQuery.values).eql(expectedQuery.values)
}

function createASelectAllQueryWithForeignKeysWithCursor (): void {
  const expectedQuery = {
    string: [
      [
        'SELECT $[contact_address.begin], $[contact_address.contact_id] FROM $[contact_address] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[cursor] > $(cursor) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address.begin], $[contact_address.contact_id] FROM $[contact_address] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[cursor] > $(cursor) AND $[case_user.user_id] = $(case_user_user_id)',
        'SELECT $[contact_address.begin], $[contact_address.contact_id] FROM $[contact_address] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_group] ON $[case_contact.case_id] = $[case_group.case_id] WHERE $[cursor] > $(cursor) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address.begin], $[contact_address.contact_id] FROM $[contact_address] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_user] ON $[case_contact.case_id] = $[case_user.case_id] WHERE $[cursor] > $(cursor) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY $[cursor] ASC',
      'OFFSET 0 ROWS FETCH NEXT $(limit) ROWS ONLY'
    ].join(' '),
    values: {
      case_group_group_id: 1,
      case_user_user_id: 1,
      cursor: 'scola',
      limit: 10
    }
  }

  const actualQuery = callCreateASelectAllQueryWithForeignKeysWithCursor(formatter)

  expect(formatter.sanitizeQuery(actualQuery.string)).eq(expectedQuery.string)
  expect(actualQuery.values).eql(expectedQuery.values)
}

function createASelectAllQueryWithForeignKeysWithForeignKey (): void {
  const expectedQuery = {
    string: [
      [
        'SELECT $[contact_address.begin], $[contact_address.contact_id] FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[case_address] ON $[address.address_id] = $[case_address.address_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[contact_address.contact_id] = $(contact_address_contact_id) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address.begin], $[contact_address.contact_id] FROM $[contact_address] JOIN $[address] ON $[contact_address.address_id] = $[address.address_id] JOIN $[case_address] ON $[address.address_id] = $[case_address.address_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[contact_address.contact_id] = $(contact_address_contact_id) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY 1',
      'OFFSET $(offset) ROWS FETCH NEXT $(limit) ROWS ONLY'
    ].join(' '),
    values: {
      case_group_group_id: 1,
      case_user_user_id: 1,
      contact_address_contact_id: 1,
      limit: 10,
      offset: 0
    }
  }

  const actualQuery = callCreateASelectAllQueryWithForeignKeysWithForeignKey(formatter)

  expect(formatter.sanitizeQuery(actualQuery.string)).eq(expectedQuery.string)
  expect(actualQuery.values).eql(expectedQuery.values)
}

function createASelectAllQueryWithForeignKeysWithOrder (): void {
  const expectedQuery = {
    string: [
      [
        'SELECT $[contact_address.begin], $[contact_address.contact_id] FROM $[contact_address] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address.begin], $[contact_address.contact_id] FROM $[contact_address] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[case_user.user_id] = $(case_user_user_id)',
        'SELECT $[contact_address.begin], $[contact_address.contact_id] FROM $[contact_address] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_group] ON $[case_contact.case_id] = $[case_group.case_id] WHERE $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address.begin], $[contact_address.contact_id] FROM $[contact_address] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_user] ON $[case_contact.case_id] = $[case_user.case_id] WHERE $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY $[contact_address.begin] DESC',
      'OFFSET $(offset) ROWS FETCH NEXT $(limit) ROWS ONLY'
    ].join(' '),
    values: {
      case_group_group_id: 1,
      case_user_user_id: 1,
      limit: 10,
      offset: 0
    }
  }

  const actualQuery = callCreateASelectAllQueryWithForeignKeysWithOrder(formatter)

  expect(formatter.sanitizeQuery(actualQuery.string)).eq(expectedQuery.string)
  expect(actualQuery.values).eql(expectedQuery.values)
}

function createASelectAllQueryWithForeignKeysWithSelect (): void {
  const expectedQuery = {
    string: [
      [
        'SELECT $[contact_address.begin] FROM $[contact_address] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address.begin] FROM $[contact_address] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[case_user.user_id] = $(case_user_user_id)',
        'SELECT $[contact_address.begin] FROM $[contact_address] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_group] ON $[case_contact.case_id] = $[case_group.case_id] WHERE $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address.begin] FROM $[contact_address] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_user] ON $[case_contact.case_id] = $[case_user.case_id] WHERE $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY 1',
      'OFFSET $(offset) ROWS FETCH NEXT $(limit) ROWS ONLY'
    ].join(' '),
    values: {
      case_group_group_id: 1,
      case_user_user_id: 1,
      limit: 10,
      offset: 0
    }
  }

  const actualQuery = callCreateASelectAllQueryWithForeignKeysWithSelect(formatter)

  expect(formatter.sanitizeQuery(actualQuery.string)).eq(expectedQuery.string)
  expect(actualQuery.values).eql(expectedQuery.values)
}

function createASelectAllQueryWithForeignKeysWithWhere (): void {
  const expectedQuery = {
    string: [
      [
        'SELECT $[contact_address.begin], $[contact_address.contact_id] FROM $[contact_address] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[contact_address.begin] > $(contact_address_begin) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address.begin], $[contact_address.contact_id] FROM $[contact_address] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[contact_address.begin] > $(contact_address_begin) AND $[case_user.user_id] = $(case_user_user_id)',
        'SELECT $[contact_address.begin], $[contact_address.contact_id] FROM $[contact_address] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_group] ON $[case_contact.case_id] = $[case_group.case_id] WHERE $[contact_address.begin] > $(contact_address_begin) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address.begin], $[contact_address.contact_id] FROM $[contact_address] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_user] ON $[case_contact.case_id] = $[case_user.case_id] WHERE $[contact_address.begin] > $(contact_address_begin) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY 1',
      'OFFSET $(offset) ROWS FETCH NEXT $(limit) ROWS ONLY'
    ].join(' '),
    values: {
      case_group_group_id: 1,
      case_user_user_id: 1,
      contact_address_begin: '2020-01-01',
      limit: 10,
      offset: 0
    }
  }

  const actualQuery = callCreateASelectAllQueryWithForeignKeysWithWhere(formatter)

  expect(formatter.sanitizeQuery(actualQuery.string)).eq(expectedQuery.string)
  expect(actualQuery.values).eql(expectedQuery.values)
}

function createASelectAllQueryWithForeignKeysWithoutParameters (): void {
  const expectedQuery = {
    string: [
      [
        'SELECT $[contact_address.begin], $[contact_address.contact_id] FROM $[contact_address] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address.begin], $[contact_address.contact_id] FROM $[contact_address] JOIN $[case_address] ON $[contact_address.address_id] = $[case_address.address_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[case_user.user_id] = $(case_user_user_id)',
        'SELECT $[contact_address.begin], $[contact_address.contact_id] FROM $[contact_address] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_group] ON $[case_contact.case_id] = $[case_group.case_id] WHERE $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[contact_address.begin], $[contact_address.contact_id] FROM $[contact_address] JOIN $[case_contact] ON $[contact_address.contact_id] = $[case_contact.contact_id] JOIN $[case_user] ON $[case_contact.case_id] = $[case_user.case_id] WHERE $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY 1',
      'OFFSET $(offset) ROWS FETCH NEXT $(limit) ROWS ONLY'
    ].join(' '),
    values: {
      case_group_group_id: 1,
      case_user_user_id: 1,
      limit: 10,
      offset: 0
    }
  }

  const actualQuery = callCreateASelectAllQueryWithForeignKeysWithoutParameters(formatter)

  expect(formatter.sanitizeQuery(actualQuery.string)).eq(expectedQuery.string)
  expect(actualQuery.values).eql(expectedQuery.values)
}

function createASelectAllQueryWithRelatedKeysWithCursor (): void {
  const expectedQuery = {
    string: [
      [
        'SELECT $[address.address_id], $[address.address_line1] FROM $[address] JOIN $[case_address] ON $[address.case_id] = $[case_address.case_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[case_address.case_id] = $(case_address_case_id) AND $[cursor] > $(cursor) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[address.address_id], $[address.address_line1] FROM $[address] JOIN $[case_address] ON $[address.case_id] = $[case_address.case_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[case_address.case_id] = $(case_address_case_id) AND $[cursor] > $(cursor) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY $[cursor] ASC',
      'OFFSET 0 ROWS FETCH NEXT $(limit) ROWS ONLY'
    ].join(' '),
    values: {
      case_address_case_id: 1,
      case_group_group_id: 1,
      case_user_user_id: 1,
      cursor: 'scola',
      limit: 10
    }
  }

  const actualQuery = callCreateASelectAllQueryWithRelatedKeysWithCursor(formatter)

  expect(formatter.sanitizeQuery(actualQuery.string)).eq(expectedQuery.string)
  expect(actualQuery.values).eql(expectedQuery.values)
}

function createASelectAllQueryWithRelatedKeysWithOrder (): void {
  const expectedQuery = {
    string: [
      [
        'SELECT $[address.address_id], $[address.address_line1] FROM $[address] JOIN $[case_address] ON $[address.case_id] = $[case_address.case_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[case_address.case_id] = $(case_address_case_id) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[address.address_id], $[address.address_line1] FROM $[address] JOIN $[case_address] ON $[address.case_id] = $[case_address.case_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[case_address.case_id] = $(case_address_case_id) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY $[address.address_line1] DESC',
      'OFFSET $(offset) ROWS FETCH NEXT $(limit) ROWS ONLY'
    ].join(' '),
    values: {
      case_address_case_id: 1,
      case_group_group_id: 1,
      case_user_user_id: 1,
      limit: 10,
      offset: 0
    }
  }

  const actualQuery = callCreateASelectAllQueryWithRelatedKeysWithOrder(formatter)

  expect(formatter.sanitizeQuery(actualQuery.string)).eq(expectedQuery.string)
  expect(actualQuery.values).eql(expectedQuery.values)
}

function createASelectAllQueryWithRelatedKeysWithSelect (): void {
  const expectedQuery = {
    string: [
      [
        'SELECT $[address.address_line1] FROM $[address] JOIN $[case_address] ON $[address.case_id] = $[case_address.case_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[case_address.case_id] = $(case_address_case_id) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[address.address_line1] FROM $[address] JOIN $[case_address] ON $[address.case_id] = $[case_address.case_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[case_address.case_id] = $(case_address_case_id) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY 1',
      'OFFSET $(offset) ROWS FETCH NEXT $(limit) ROWS ONLY'
    ].join(' '),
    values: {
      case_address_case_id: 1,
      case_group_group_id: 1,
      case_user_user_id: 1,
      limit: 10,
      offset: 0
    }
  }

  const actualQuery = callCreateASelectAllQueryWithRelatedKeysWithSelect(formatter)

  expect(formatter.sanitizeQuery(actualQuery.string)).eq(expectedQuery.string)
  expect(actualQuery.values).eql(expectedQuery.values)
}

function createASelectAllQueryWithRelatedKeysWithWhere (): void {
  const expectedQuery = {
    string: [
      [
        'SELECT $[address.address_id], $[address.address_line1] FROM $[address] JOIN $[case_address] ON $[address.case_id] = $[case_address.case_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[case_address.case_id] = $(case_address_case_id) AND $[address.address_line1] = $(address_address_line1) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[address.address_id], $[address.address_line1] FROM $[address] JOIN $[case_address] ON $[address.case_id] = $[case_address.case_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[case_address.case_id] = $(case_address_case_id) AND $[address.address_line1] = $(address_address_line1) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY 1',
      'OFFSET $(offset) ROWS FETCH NEXT $(limit) ROWS ONLY'
    ].join(' '),
    values: {
      address_address_line1: 'scola',
      case_address_case_id: 1,
      case_group_group_id: 1,
      case_user_user_id: 1,
      limit: 10,
      offset: 0
    }
  }

  const actualQuery = callCreateASelectAllQueryWithRelatedKeysWithWhere(formatter)

  expect(formatter.sanitizeQuery(actualQuery.string)).eq(expectedQuery.string)
  expect(actualQuery.values).eql(expectedQuery.values)
}

function createASelectAllQueryWithRelatedKeysWithoutParameters (): void {
  const expectedQuery = {
    string: [
      [
        'SELECT $[address.address_id], $[address.address_line1] FROM $[address] JOIN $[case_address] ON $[address.case_id] = $[case_address.case_id] JOIN $[case_group] ON $[case_address.case_id] = $[case_group.case_id] WHERE $[case_address.case_id] = $(case_address_case_id) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[address.address_id], $[address.address_line1] FROM $[address] JOIN $[case_address] ON $[address.case_id] = $[case_address.case_id] JOIN $[case_user] ON $[case_address.case_id] = $[case_user.case_id] WHERE $[case_address.case_id] = $(case_address_case_id) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY 1',
      'OFFSET $(offset) ROWS FETCH NEXT $(limit) ROWS ONLY'
    ].join(' '),
    values: {
      case_address_case_id: 1,
      case_group_group_id: 1,
      case_user_user_id: 1,
      limit: 10,
      offset: 0
    }
  }

  const actualQuery = callCreateASelectAllQueryWithRelatedKeysWithoutParameters(formatter)

  expect(formatter.sanitizeQuery(actualQuery.string)).eq(expectedQuery.string)
  expect(actualQuery.values).eql(expectedQuery.values)
}

function createASelectAllQueryWithoutKeysWithCursor (): void {
  const expectedQuery = {
    string: [
      [
        'SELECT $[case.case_id], $[case.name] FROM $[case] JOIN $[case_group] ON $[case.case_id] = $[case_group.case_id] WHERE $[cursor] > $(cursor) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[case.case_id], $[case.name] FROM $[case] JOIN $[case_user] ON $[case.case_id] = $[case_user.case_id] WHERE $[cursor] > $(cursor) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY $[cursor] ASC',
      'OFFSET 0 ROWS FETCH NEXT $(limit) ROWS ONLY'
    ].join(' '),
    values: {
      case_group_group_id: 1,
      case_user_user_id: 1,
      cursor: 'scola',
      limit: 10
    }
  }

  const actualQuery = callCreateASelectAllQueryWithoutKeysWithCursor(formatter)

  expect(formatter.sanitizeQuery(actualQuery.string)).eq(expectedQuery.string)
  expect(actualQuery.values).eql(expectedQuery.values)
}

function createASelectAllQueryWithoutKeysWithOrder (): void {
  const expectedQuery = {
    string: [
      [
        'SELECT $[case.case_id], $[case.name] FROM $[case] JOIN $[case_group] ON $[case.case_id] = $[case_group.case_id] WHERE $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[case.case_id], $[case.name] FROM $[case] JOIN $[case_user] ON $[case.case_id] = $[case_user.case_id] WHERE $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY $[case.name] DESC',
      'OFFSET $(offset) ROWS FETCH NEXT $(limit) ROWS ONLY'
    ].join(' '),
    values: {
      case_group_group_id: 1,
      case_user_user_id: 1,
      limit: 10,
      offset: 0
    }
  }

  const actualQuery = callCreateASelectAllQueryWithoutKeysWithOrder(formatter)

  expect(formatter.sanitizeQuery(actualQuery.string)).eq(expectedQuery.string)
  expect(actualQuery.values).eql(expectedQuery.values)
}

function createASelectAllQueryWithoutKeysWithSelect (): void {
  const expectedQuery = {
    string: [
      [
        'SELECT $[case.name] FROM $[case] JOIN $[case_group] ON $[case.case_id] = $[case_group.case_id] WHERE $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[case.name] FROM $[case] JOIN $[case_user] ON $[case.case_id] = $[case_user.case_id] WHERE $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY 1',
      'OFFSET $(offset) ROWS FETCH NEXT $(limit) ROWS ONLY'
    ].join(' '),
    values: {
      case_group_group_id: 1,
      case_user_user_id: 1,
      limit: 10,
      offset: 0
    }
  }

  const actualQuery = callCreateASelectAllQueryWithoutKeysWithSelect(formatter)

  expect(formatter.sanitizeQuery(actualQuery.string)).eq(expectedQuery.string)
  expect(actualQuery.values).eql(expectedQuery.values)
}

function createASelectAllQueryWithoutKeysWithWhere (): void {
  const expectedQuery = {
    string: [
      [
        'SELECT $[case.case_id], $[case.name] FROM $[case] JOIN $[case_group] ON $[case.case_id] = $[case_group.case_id] WHERE LOWER($[case.name]) LIKE LOWER($(case_name)) AND $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[case.case_id], $[case.name] FROM $[case] JOIN $[case_user] ON $[case.case_id] = $[case_user.case_id] WHERE LOWER($[case.name]) LIKE LOWER($(case_name)) AND $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY 1',
      'OFFSET $(offset) ROWS FETCH NEXT $(limit) ROWS ONLY'
    ].join(' '),
    values: {
      case_group_group_id: 1,
      case_name: '%scola',
      case_user_user_id: 1,
      limit: 10,
      offset: 0
    }
  }

  const actualQuery = callCreateASelectAllQueryWithoutKeysWithWhere(formatter)

  expect(formatter.sanitizeQuery(actualQuery.string)).eq(expectedQuery.string)
  expect(actualQuery.values).eql(expectedQuery.values)
}

function createASelectAllQueryWithoutKeysWithoutParameters (): void {
  const expectedQuery = {
    string: [
      [
        'SELECT $[case.case_id], $[case.name] FROM $[case] JOIN $[case_group] ON $[case.case_id] = $[case_group.case_id] WHERE $[case_group.group_id] = $(case_group_group_id)',
        'SELECT $[case.case_id], $[case.name] FROM $[case] JOIN $[case_user] ON $[case.case_id] = $[case_user.case_id] WHERE $[case_user.user_id] = $(case_user_user_id)'
      ].join(' UNION '),
      'ORDER BY 1',
      'OFFSET $(offset) ROWS FETCH NEXT $(limit) ROWS ONLY'
    ].join(' '),
    values: {
      case_group_group_id: 1,
      case_user_user_id: 1,
      limit: 10,
      offset: 0
    }
  }

  const actualQuery = callCreateASelectAllQueryWithoutKeysWithoutParameters(formatter)

  expect(formatter.sanitizeQuery(actualQuery.string)).eq(expectedQuery.string)
  expect(actualQuery.values).eql(expectedQuery.values)
}

function createAnInsertQuery (): void {
  const expectedQuery = {
    string: 'INSERT INTO $[contact] ($[family_name],$[given_name]) VALUES ($(family_name),$(given_name))',
    values: {
      family_name: 'sql',
      given_name: 'scola'
    }
  }

  const actualQuery = callCreateAnInsertQuery(formatter)

  expect(formatter.sanitizeQuery(actualQuery.string)).eq(expectedQuery.string)
  expect(actualQuery.values).eql(expectedQuery.values)
}

function createAnUpdateQuery (): void {
  const expectedQuery = {
    string: 'UPDATE $[contact] SET $[family_name] = $(family_name),$[given_name] = $(given_name) WHERE $[contact_id] = $(contact_id)',
    values: {
      contact_id: 1,
      family_name: 'sql',
      given_name: 'scola'
    }
  }

  const actualQuery = callCreateAnUpdateQuery(formatter)

  expect(formatter.sanitizeQuery(actualQuery.string)).eq(expectedQuery.string)
  expect(actualQuery.values).eql(expectedQuery.values)
}

function formatAQuery (): void {
  const expectedQuery = `
    SELECT *
    FROM [scola].[test_connection]
    WHERE
      [test] = NULL AND
      [test] = NULL AND
      [test] = 'true' AND
      [test] = 1 AND
      [test] = '1' AND
      [test] = '1' AND
      [test] = '{\\"number\\":3}'
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
