import flat from 'flat'

const numberType = Symbol('NumberType')
const stringType = Symbol('StringType')
const boolType = Symbol('BoolType')
const dateType = Symbol('DateType')

const primitiveTypesMap = {
  [numberType]: Number,
  [stringType]: String,
  [boolType]: Boolean,
  [dateType]: Date
}

const validateAndFlattenSchema = (schema, path = '$') => {
  if(schema == null || schema.constructor !== Object) {
    throw new Error(`Wrong schema at ${path} - contain ${schema}`)
  }
  const fields = {}

  for(const key of Object.keys(schema)) {
    if (primitiveTypes.hasOwnProperty(schema[key])) {
      fields[`${path}.${key}`] = primitiveTypesMap[schema[key]]
    } else if(
      Array.isArray(schema[key]) &&
      schema[key].length === 2 &&
      Number.isSafeInteger(schema[key][1])
    ) {
      Object.assign(
        fields,
        validateSchema(schema[key][0], `${path}.${key}[]`)
      )
    } else {
      Object.assign(
        fields,
        validateSchema(schema[key], `${path}.${key}`)
      )
    }
  }

  return fields
}

const makeCreateTableBySchema = (schema, baseTableName) => {
  const fieldSchema = validateAndFlattenSchema(schema)
  const sortedFields = Object.keys(fieldSchema).map((key) => {
    const liveKey = new String(key)
    liveKey.nestedLevel = liveKey.match(/\[\]/g).length
    return liveKey
  }).sort((a, b) => (a.nestedLevel !== b.nestedLevel)
      ? a.nestedLevel < b.nestedLevel
      : a < b
  )

  const tablesSchemata = { [baseTableName]: {} }

  for(const key of sortedFields) {
    const lastArrayPos = key.lastIndexOf('[]')
    const longestPrefix = lastArrayPos > -1 ? key.substring(0, lastArrayPos) : ''
    const fieldName = lastArrayPos > -1 ? key.substring(lastArrayPos + 2) : key
    
    const tableName = `${baseTableName}-${longestPrefix}`
    if (!tablesSchemata.hasOwnProperty(tableName)) {
      tablesSchemata[tableName] = {}
    }

    let typeDecl = null
    switch(fieldSchema[key]) {
      case stringType: {
        typeDecl = 'VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
        break
      }
      case dateType: {
        typeDecl = 'DATETIME'
        break
      }
      case numberType: {
        typeDecl = 'BIGINT'
        break
      }
      case boolType: {
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
    sql += `CREATE TABLE ${escapeId(tableName)} (\nRowId VARCHAR(64) NOT NULL, `

    for(const columnName of Object.keys(tableName)) {
      sql += `${escapeId(columnName)} ${tableSchema[columnName]} NULL,`
    }
      
    sql += `PRIMARY KEY(RowId)\n)\n`
  }

  return sql
}

const validateAndFlatDocumentSchema = (schema, document) => {
  const fieldSchema = validateAndFlattenSchema(schema)
  const flatDocument = flat(document)
  
  for(const key of Object.keys(flatDocument)) {
    const pureKey = key.replace(/\.(\d+)($|\.)/ig, '[]$2')
    if(fieldSchema.hasOwnProperty(`$.${pureKey}`)) {
      throw new Error(`Document does not match schema ${pureKey}`) 
    }

    const expectedValueType = schema[pureKey]
    const value = flatDocument[key]
    if(value != null && value.constructor !== expectedValueType) {
      throw new Error(`Incompatible type at ${pureKey} with ${value}`)
    }
  }

  return flatDocument
}

