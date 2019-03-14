import flat from 'flat'

export const leftPrefixMark = Symbol('LeftPrefixMark')
export const numberType = Symbol('NumberType')
export const stringType = Symbol('StringType')
export const boolType = Symbol('BoolType')
export const dateType = Symbol('DateType')

const escapeId = str => `\`${String(str).replace(/[`\\]/ig, '\\$1')}\``
const escape = str => `"${String(str).replace(/["\\]/ig, '\\$1')}"`

const primitiveTypesMap = {
  [numberType]: Number,
  [stringType]: String,
  [boolType]: Boolean,
  [dateType]: Date
}

export const validateAndFlattenSchema = (schema, path = '$') => {
  if(schema == null || schema.constructor !== Object) {
    throw new Error(`Wrong schema at ${path} - contain ${JSON.stringify(schema)}`)
  }
  const fields = {}

  for(const key of Object.keys(schema)) {
    if (typeof schema[key] === 'symbol' && primitiveTypesMap[schema[key]] != null) {
      fields[`${path}.${key}`] = primitiveTypesMap[schema[key]]
    } else if(Array.isArray(schema[key]) && schema[key].length === 1) {
      if(typeof schema[key][0] === 'symbol' && primitiveTypesMap[schema[key][0]] != null) {
        fields[`${path}.${key}[]`] = primitiveTypesMap[schema[key][0]]
      } else {
        Object.assign(
          fields,
          validateAndFlattenSchema(schema[key][0], `${path}.${key}[]`)
        )
      }
    } else {
      Object.assign(
        fields,
        validateAndFlattenSchema(schema[key], `${path}.${key}`)
      )
    }
  }

  return fields
}

export const makeCreateTableBySchema = (schema, baseTableName) => {
  const fieldSchema = validateAndFlattenSchema(schema)
  const sortedFields = Object.keys(fieldSchema).map((key) => {
    const liveKey = new String(key.substring(2))
    const matchedArrayLevel = liveKey.match(/\[\]/g)
    liveKey.nestedLevel = matchedArrayLevel != null
      ? matchedArrayLevel.length
      : 0
    return liveKey
  }).sort((a, b) => (a.nestedLevel !== b.nestedLevel)
  ? (a.nestedLevel < b.nestedLevel ? -1 : 1)
  : (a < b) ? -1 : 1
)

  const tablesSchemata = { }

  for(const key of sortedFields) {
    const lastArrayPos = key.lastIndexOf('[]')
    const longestPrefix = lastArrayPos > -1 ? key.substring(0, lastArrayPos) : ''
    const fieldName = lastArrayPos > -1 ? key.substring(lastArrayPos + 2) : key

    const tableName = longestPrefix.length > 0
      ? `${baseTableName}-${longestPrefix}`
      : baseTableName

    if (tablesSchemata[tableName] == null) {
      tablesSchemata[tableName] = {}
    }

    let typeDecl = null
    switch(fieldSchema[`$.${key}`]) {
      case primitiveTypesMap[stringType]: {
        typeDecl = 'VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
        break
      }
      case primitiveTypesMap[dateType]: {
        typeDecl = 'DATETIME'
        break
      }
      case primitiveTypesMap[numberType]: {
        typeDecl = 'BIGINT'
        break
      }
      case primitiveTypesMap[boolType]: {
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
    sql += `CREATE TABLE ${escapeId(tableName)}(\n  \`AggregateId\` VARCHAR(128) NOT NULL, \n`
    sql += `  \`AggregateVersion\` BIGINT NOT NULL, \n`

    for(const columnName of Object.keys(tableSchema)) {
      const fieldName = columnName.length > 0 ? columnName : '<INTERNAL>'
      sql += `  ${escapeId(fieldName)} ${tableSchema[columnName]} NULL, \n`
    }
      
    sql += `  PRIMARY KEY(\`AggregateId\`), \n  INDEX USING BTREE(\`AggregateVersion\`)\n`
    sql += `);\n`
  }

  return sql
}

export const validateAndFlatDocumentSchema = (schema, document) => {
  const fieldSchema = validateAndFlattenSchema(schema)
  const flatDocument = flat(document)
  
  for(const key of Object.keys(flatDocument)) {
    const pureKey = key.replace(/\.(\d+)($|\.)/ig, '[]$2')
    const expectedType = fieldSchema[`$.${pureKey}`]

    if(expectedType == null) {
      throw new Error(`Document does not match schema ${pureKey}`) 
    }
    const value = flatDocument[key]
    
    if(value != null && value.constructor !== expectedType) {
      throw new Error(`Incompatible type at ${pureKey} with ${value}`)
    }
  }

  return flatDocument
}

export const makeSaveDocument = (schema, aggregateId, baseTableName, document) => {
  const flatDocument = validateAndFlatDocumentSchema(schema, document)

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
  }).sort((a, b) => (a.nestedLevel !== b.nestedLevel)
      ? (a.nestedLevel < b.nestedLevel ? -1 : 1)
      : (a < b) ? -1 : 1
  )

  const multiArrayIndexes = {}
  const tablesAffinity = {}

  for(const key of sortedFields) {
    const pureKey = key.replace(/\[(\d+)\]/ig, '[]')
    const lastArrayPos = pureKey.lastIndexOf('[]')
    const longestPrefix = lastArrayPos > -1 ? pureKey.substring(0, lastArrayPos) : ''
    const fieldName = lastArrayPos > -1 ? pureKey.substring(lastArrayPos + 2) : pureKey

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

  let sql = ''
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
          case Date: return escape(row[fieldName].toISOString())
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
