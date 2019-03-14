import {
  makeCreateTableBySchema,
  makeSaveDocument,
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

const document = {
  a: {
    aa: [11, 22, 33, 44],
    ab: 'Qwerty'
  },
  b: [
    {
      ba: 10,
      bb: 'Text',
      bc: [
        {
          bca: 100,
          bcb: 'AAA'
        },
        {
          bca: 200,
          bcb: 'BBB'
        }
      ]
    }
  ],
  c: true,
  d: new Date()
}

console.log(makeCreateTableBySchema(schema, 'Stories'))

console.log(makeSaveDocument(schema, 'AggId', 'Stories', document))
