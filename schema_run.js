import {
  validateAndFlatDocumentSchema,
  makeCreateTableBySchema,
  validateAndFlattenSchema,
  numberType,
  stringType,
  boolType,
  dateType
} from './schema'

const schema = {
    a: {
      aa: [numberType],
      ab: stringType
    },
    b: [{
        ba: numberType,
        bb: stringType,
        bc: [{
          bca: numberType,
          bcb: stringType
        }]
    }],
    c: boolType,
    d: dateType
  }

// console.log(validateAndFlattenSchema(schema))

console.log(makeCreateTableBySchema(schema, 'Stories'))
