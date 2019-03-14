import {
  validateAndFlatDocumentSchema,
  makeCreateTableBySchema,
  validateAndFlattenSchema,
  numberType,
  stringType,
  boolType,
  dateType
} from './schema'

const res = validateAndFlattenSchema({
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
})

console.log(res)
