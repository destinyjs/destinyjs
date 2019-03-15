import { flatten, unflatten } from 'flat'

export const leftPrefixMark = Symbol('LeftPrefixMark')
export const numberType = Symbol('NumberType')
export const stringType = Symbol('StringType')
export const boolType = Symbol('BoolType')
export const dateType = Symbol('DateType')

const escapeId = str => `\`${String(str).replace(/[`\\]/ig, '\\$1')}\``
const escape = str => `"${String(str).replace(/["\\]/ig, '\\$1')}"`

const primitiveTypesMap = new Map([
  [numberType, Number],
  [stringType, String],
  [boolType, Boolean],
  [dateType, Date]
])

export const validateAndFlattenSchema = (schema, path = '$') => {
  if(schema == null || schema.constructor !== Object) {
    throw new Error(`Wrong schema at ${path} - contain ${JSON.stringify(schema)}`)
  }
  const fields = new Map()

  for(const key in schema) {
    if(!schema.hasOwnProperty(key)) {
      continue
    }
    const value = schema[key]
    if (typeof value === 'symbol' && primitiveTypesMap.has(value)) {
      fields.set(`${path}.${key}`, primitiveTypesMap.get(value))
    } else if(Array.isArray(value) && value.length === 1) {
      const subValue = value[0]
      const subPath = `${path}.${key}[]`
      if(typeof subValue === 'symbol' && primitiveTypesMap.has(subValue)) {
        fields.set(subPath, primitiveTypesMap.get(subValue))
      } else {
        const subFields = validateAndFlattenSchema(subValue, subPath)

        subFields.forEach((value, key) => {
          fields.set(key, value);
        })
      }
    } else {
      const subPath = `${path}.${key}`

      const subFields = validateAndFlattenSchema(schema[key], subPath)

      subFields.forEach((value, key) => {
          fields.set(key, value);
      })
    }
  }

  return fields
}

const sortByNestedLevel = (a, b) => (a.nestedLevel !== b.nestedLevel)
    ? (a.nestedLevel < b.nestedLevel ? -1 : 1)
    : (a < b) ? -1 : 1

export const makeCreateTableBySchema = (schema, baseTableName) => {
  const fieldSchema = validateAndFlattenSchema(schema)
  const sortedFields = []

  fieldSchema.forEach((value, key) => {
    const liveKey = new String(key.substring(2))
    const matchedArrayLevel = liveKey.match(/\[\]/g)
    liveKey.nestedLevel = matchedArrayLevel != null
      ? matchedArrayLevel.length
      : 0
    sortedFields.push(liveKey)
  })

  sortedFields.sort(sortByNestedLevel)

  const tablesSchemata = { }

  const sortedFieldsLength = sortedFields.length
  for(let keyIndex = 0; keyIndex < sortedFieldsLength; keyIndex++) {
    const key = sortedFields[keyIndex]

    const lastArrayPos = key.lastIndexOf('[]')
    const longestPrefix = lastArrayPos > -1 ? key.substring(0, lastArrayPos) : ''
    const fieldName = lastArrayPos > -1 ? key.substring(lastArrayPos + 3) : key

    const tableName = longestPrefix.length > 0
      ? `${baseTableName}-${longestPrefix}`
      : baseTableName

    if (tablesSchemata[tableName] == null) {
      tablesSchemata[tableName] = {}
    }

    let typeDecl = null
    switch(fieldSchema.get(`$.${key}`)) {
      case primitiveTypesMap.get(stringType): {
        typeDecl = 'VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
        break
      }
      case primitiveTypesMap.get(dateType): {
        typeDecl = 'DATETIME'
        break
      }
      case primitiveTypesMap.get(numberType): {
        typeDecl = 'BIGINT'
        break
      }
      case primitiveTypesMap.get(boolType): {
        typeDecl = 'BOOLEAN'
        break
      }
      default: {
        throw new Error(`Wrong data type in table`)
      }
    }

    tablesSchemata[tableName][fieldName] = typeDecl
  }

  let sql = ''
  for(const tableName of Object.keys(tablesSchemata)) {
    const tableSchema = tablesSchemata[tableName]
    // TODO: conditional drop table
    sql += `DROP TABLE IF EXISTS ${escapeId(tableName)};\n`
    sql += `CREATE TABLE ${escapeId(tableName)}(\n  `
    sql += `  \`AggregateId\` VARCHAR(128) NOT NULL, \n`
    sql += `  \`AggregateVersion\` BIGINT NOT NULL DEFAULT 0, \n`
    sql += `  \`LeftPrefix\` VARCHAR(700) NOT NULL, \n`

    for(const columnName of Object.keys(tableSchema)) {
      const fieldName = columnName.length > 0 ? columnName : '<INTERNAL>'
      sql += `  ${escapeId(fieldName)} ${tableSchema[columnName]} NULL, \n`
    }

    sql += `  INDEX USING BTREE(\`AggregateId\`), \n`
    sql += `  INDEX USING BTREE(\`AggregateVersion\`)\n`
    sql += `);\n`
  }

  return sql
}

const regexBrackets = /\[\]/g

export const getTablesBySchema = (schema, baseTableName) => {
  const fieldSchema = validateAndFlattenSchema(schema)
  const sortedFields = []

  fieldSchema.forEach((value, key) => {
    const liveKey = new String(key.substring(2))
    const matchedArrayLevel = liveKey.match(regexBrackets)
    liveKey.nestedLevel = matchedArrayLevel != null
      ? matchedArrayLevel.length
      : 0
    sortedFields.push(liveKey)
  })

  sortedFields.sort(sortByNestedLevel)

  const tablesSchemata = { }

  for(const key of sortedFields) {
    const lastArrayPos = key.lastIndexOf('[]')
    const longestPrefix = lastArrayPos > -1 ? key.substring(0, lastArrayPos) : ''
    const fieldName = lastArrayPos > -1 ? key.substring(lastArrayPos + 3) : key

    const tableName = longestPrefix.length > 0
      ? `${baseTableName}-${longestPrefix}`
      : baseTableName

    if (tablesSchemata[tableName] == null) {
      tablesSchemata[tableName] = {}
    }

    tablesSchemata[tableName][fieldName] = fieldSchema.get(`$.${key}`)
  }

  return tablesSchemata
}

export const makeSaveDocument = (schema, aggregateId, baseTableName, document) => {
  const fieldSchema = validateAndFlattenSchema(schema)
  const flatDocument = flatten(document)

  const allTableNames = Object.keys(getTablesBySchema(schema, baseTableName))
  let sql = ''
  for(const tableName of allTableNames) {
    sql += `DELETE FROM ${escapeId(tableName)} WHERE ${escapeId('AggregateId')} = ${escape(aggregateId)};\n`
  }

  for(const key of Object.keys(flatDocument)) {
    const pureKey = key.replace(/\.(\d+)($|\.)/ig, '[]$2')
    const expectedType = fieldSchema.get(`$.${pureKey}`)

    if(expectedType == null) {
      throw new Error(`Document does not match schema ${pureKey}`)
    }
    const value = flatDocument[key]

    if(value != null && value.constructor !== expectedType) {
      throw new Error(`Incompatible type at ${pureKey} with ${value}`)
    }
  }

  const sortedFields = Object.keys(flatDocument).map((key) => {
    const liveKey = new String(key.replace(/\.(\d+)($|\.)/ig, '[$1]$2'))
    const matchedArrayLevel = liveKey.match(/\[\d+\]/g)
    liveKey.nestedLevel = matchedArrayLevel != null
      ? matchedArrayLevel.length
      : 0

    liveKey.arrayLevel = matchedArrayLevel != null
      ? matchedArrayLevel.map(
        lev => Number(lev.substring(1, lev.length - 1))
      )
      : null

    liveKey.originalKey = key
    return liveKey
  })

  sortedFields.sort(sortByNestedLevel)

  const multiArrayIndexes = {}
  const tablesAffinity = {}

  for(const key of sortedFields) {
    const pureKey = key.replace(/\[(\d+)\]/ig, '[]')
    const lastArrayPos = pureKey.lastIndexOf('[]')
    const longestPrefix = lastArrayPos > -1 ? pureKey.substring(0, lastArrayPos) : ''
    const fieldName = lastArrayPos > -1 ? pureKey.substring(lastArrayPos + 3) : pureKey

    const leftPrefix = key.substr(0, key.lastIndexOf('['))
    
    const tableName = longestPrefix.length > 0
      ? `${baseTableName}-${longestPrefix}`
      : baseTableName

    if(tablesAffinity[tableName] == null) {
      tablesAffinity[tableName] = []
    }

    let documentIndex = 0
    if(key.arrayLevel != null) {
      const keyIdx = String(key.arrayLevel)
      if(multiArrayIndexes[keyIdx] != null) {
        documentIndex = multiArrayIndexes[keyIdx]
      } else {
        documentIndex = Object.keys(multiArrayIndexes).length + 1
        multiArrayIndexes[keyIdx] = documentIndex
      }
    }

    if(tablesAffinity[tableName][documentIndex] == null) {
      tablesAffinity[tableName][documentIndex] = {
        [leftPrefixMark]: leftPrefix
      }
    }

    const targetDocument = tablesAffinity[tableName][documentIndex]

    const columnName = fieldName.length > 0 ? fieldName : '<INTERNAL>'

    targetDocument[columnName] = flatDocument[key.originalKey]    
  }

  for(const tableName of Object.keys(tablesAffinity)) {
    for(let i = 0; i< tablesAffinity[tableName].length; i++) {
      const row = tablesAffinity[tableName][i]
      if(row == null) {
        continue
      }

      sql += `INSERT INTO ${escapeId(tableName)}(\n  `
      const fields = Object.keys(row)
      sql += ['AggregateId', 'LeftPrefix', ...fields].map(
        key => escapeId(key)
      ).join(',\n  ')

      sql += '\n) VALUES ( \n  '
      sql += `${escape(aggregateId)},\n  ${escape(row[leftPrefixMark])},  \n  `

      sql += fields.map(fieldName => {
        switch(row[fieldName].constructor) {
          case String: return escape(row[fieldName])
          case Number: return +row[fieldName]
          case Boolean: return row[fieldName] ? 1 : 0
          case Date: return escape(row[fieldName].toISOString().replace(/[TZ]/ig, ' '))
          default: {
            throw new Error(`Incorrect type at ${row[leftPrefixMark]}${fieldName}`)
          }
        }

      }).join(',\n  ')

      sql += '\n);\n'
    }
    
  }

  return sql
}

export const makeLoadDocument = (schema, aggregateId, baseTableName) => {
  const tablesSchemata = getTablesBySchema(schema, baseTableName)
  const allTableNames = Object.keys(tablesSchemata)
  const allFields = new Set()

  for(const tableName of allTableNames) {
    for(const key of Object.keys(tablesSchemata[tableName])) {
      const columnName = key.length > 0 ? key : '<INTERNAL>'
      allFields.add(columnName)
    }
  }

  let sql = ''
  for(const tableName of allTableNames) {
    sql += `(SELECT \`AggregateId\`, \`LeftPrefix\`, `
    for(const key of allFields.values()) {
      if(tablesSchemata[tableName][key] != null) {
        sql += `  ${escapeId(key)} AS ${escapeId(key)},\n`
      } else {
        sql += `  NULL AS ${escapeId(key)},\n`
      }
    }

      sql += `  ${escape(tableName)} AS \`SourceTableName\`\n`
      sql += `FROM ${escapeId(tableName)}\n`
      sql += `WHERE \`AggregateId\` = ${escape(aggregateId)}\n`

      sql += `)\nUNION ALL\n`
  }
  
  sql = sql.substring(0, sql.length - 10)

  return sql
}

export const vivificateJsonBySchema = (resultSet, baseTableName) => {
  const unflattenDocument = {}
  const lastArrayIndexesByTable = {}
  const [rowList] = resultSet

  for(const row of rowList) {
    const { AggregateId, LeftPrefix, SourceTableName, ...fields } = row
    for(const fieldName of Object.keys(fields)) {
      const value = fields[fieldName]
      if(value == null) {
        continue
      }

      if(SourceTableName === baseTableName) {
        unflattenDocument[fieldName] = value
        unflattenDocument.aggregateId = AggregateId
      } else {
        if(lastArrayIndexesByTable[LeftPrefix] == null) {
          lastArrayIndexesByTable[LeftPrefix] = 0
        }

        const idx = lastArrayIndexesByTable[LeftPrefix]++

        const compoundKey = `${LeftPrefix}[${idx}].${fieldName}`
        const unflattenKey = compoundKey.replace(/\[(\d+)\]/, '.$1')

        unflattenDocument[unflattenKey] = value
      }

    }
  }

  const result = unflatten(unflattenDocument)

  return result
}