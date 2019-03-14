const numberType = Symbol('NumberType')
const stringType = Symbol('StringType')
const boolType = Symbol('BoolType')
const dateType = Symbol('DateType')

{
  a: numberType,
  b: stringType:
  c: {
    e: stringType,
    d: {
     e: [0,1,2] 
    }
  }

}

const validateSchema = (schema) => {
  if(schema == null || schema.constructor !== Object) {
    throw new Error('Wrong schema - should be object')
  }

  
}

const validateDocumentSchema = (schema, document) => {

}



const loadJsonBySchema = async (connection, schema, tableName, rowId) => {

}

const saveJsonBySchema = async (connection, schema, tableName, rowId, document) => {
  validateDocumentSchema(schema, document)

}