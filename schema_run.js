const mysql = require('mysql2/promise')
const stringify = require('json-stable-stringify')

const {
  makeCreateTableBySchema,
  makeSaveDocument,
  makeLoadDocument,
  vivificateJsonBySchema,
  numberType,
  stringType,
  boolType,
  dateType
} = require('./schema')

const main = async () => {
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

  const connection = await mysql.createConnection({
    multipleStatements: true,
    database: 'hk',
    user: 'root',
    password: 'root',
    host: '127.0.0.1',
    port: 3306
  })

  const iterations = 100000
  const pool = {}
  const tablesDeclaration = makeCreateTableBySchema(pool, schema, 'Stories')
  await connection.query(tablesDeclaration)
  let dt1 = null, dt2 = null, ops = null

  dt1 = Date.now()
  for(let i = 0; i < iterations; i++) {
    const saveDocumentDeclaration = makeSaveDocument(pool, schema, 'AggId', 'Stories', document)
    // await connection.query(saveDocumentDeclaration)
  }

  dt2 = Date.now()
  ops = (iterations / (dt2 - dt1)) * 1000
  console.log(`Avarage ${ops} write ops per second`)


  const rowList = [[{"AggregateId":"AggId","LeftPrefix":"","a.ab":"Qwerty","c":1,"d":"2019-03-15T07:55:00.000Z",".INTERNAL.":null,"ba":null,"bb":null,"bca":null,"bcb":null,"SourceTableName":"Stories"},{"AggregateId":"AggId","LeftPrefix":"a.aa","a.ab":null,"c":null,"d":null,".INTERNAL.":11,"ba":null,"bb":null,"bca":null,"bcb":null,"SourceTableName":"Stories-a.aa"},{"AggregateId":"AggId","LeftPrefix":"a.aa","a.ab":null,"c":null,"d":null,".INTERNAL.":22,"ba":null,"bb":null,"bca":null,"bcb":null,"SourceTableName":"Stories-a.aa"},{"AggregateId":"AggId","LeftPrefix":"a.aa","a.ab":null,"c":null,"d":null,".INTERNAL.":33,"ba":null,"bb":null,"bca":null,"bcb":null,"SourceTableName":"Stories-a.aa"},{"AggregateId":"AggId","LeftPrefix":"a.aa","a.ab":null,"c":null,"d":null,".INTERNAL.":44,"ba":null,"bb":null,"bca":null,"bcb":null,"SourceTableName":"Stories-a.aa"},{"AggregateId":"AggId","LeftPrefix":"b","a.ab":null,"c":null,"d":null,".INTERNAL.":null,"ba":10,"bb":"Text","bca":null,"bcb":null,"SourceTableName":"Stories-b"},{"AggregateId":"AggId","LeftPrefix":"b[0].bc","a.ab":null,"c":null,"d":null,".INTERNAL.":null,"ba":null,"bb":null,"bca":100,"bcb":"AAA","SourceTableName":"Stories-b[].bc"},{"AggregateId":"AggId","LeftPrefix":"b[0].bc","a.ab":null,"c":null,"d":null,".INTERNAL.":null,"ba":null,"bb":null,"bca":200,"bcb":"BBB","SourceTableName":"Stories-b[].bc"}], []]

  dt1 = Date.now()
  for(let i = 0; i < iterations; i++) {
    const loadDocumentDeclataion = makeLoadDocument(pool, schema, 'AggId', 'Stories')
    // const rowList = await connection.query(loadDocumentDeclataion)
    const originalDocument = vivificateJsonBySchema(pool, schema, rowList, 'Stories')
  }

  dt2 = Date.now()
  ops = (iterations / (dt2 - dt1)) * 1000
  console.log(`Avarage ${ops} read ops per second`)

  process.exit(0)
}

main()