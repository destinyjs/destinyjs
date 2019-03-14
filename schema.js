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

const validateDocumentSchema = (schema, document) => {
  const fieldSchema = validateAndFlattenSchema(schema)
  const flatDocument = flat(document)
  
  for(const key of Object.keys(flatDocument)) {
    const pureKey = key.replace(/\.(\d+)($|\.)/ig, '[]$2')
    if(fieldSchema.hasOwnProperty(pureKey)) {
      throw new Error(`Document does not match schema ${pureKey}`) 
    }

    const expectedValueType = schema[pureKey]
    const value = flatDocument[key]
    if(value != null && value.constructor !== expectedValueType) {
      throw new Error(`Incompatible type at ${pureKey} with ${value}`)
    }
  }
}



const loadJsonBySchema = async (connection, schema, tableName, rowId) => {

}

const saveJsonBySchema = async (connection, schema, tableName, rowId, document) => {
  validateDocumentSchema(schema, document)

}