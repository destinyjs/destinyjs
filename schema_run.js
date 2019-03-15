import mysql from 'mysql2/promise'
import stringify from 'json-stable-stringify'

import {
  makeCreateTableBySchema,
  makeSaveDocument,
  makeLoadDocument,
  vivificateJsonBySchema,
  numberType,
  stringType,
  boolType,
  dateType
} from './schema'

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

  const iterations = 1000
  const pool = {}
  const tablesDeclaration = makeCreateTableBySchema(pool, schema, 'Stories')
  await connection.query(tablesDeclaration)
  let dt1 = null, dt2 = null, ops = null

  dt1 = Date.now()
  for(let i = 0; i < iterations; i++) {
    const saveDocumentDeclaration = makeSaveDocument(pool, schema, 'AggId', 'Stories', document)
    await connection.query(saveDocumentDeclaration)

    const loadDocumentDeclataion = makeLoadDocument(pool, schema, 'AggId', 'Stories')
    const rowList = await connection.query(loadDocumentDeclataion)

    const originalDocument = vivificateJsonBySchema(pool, schema, rowList, 'Stories')
    //console.log(stringify(originalDocument))
    //console.log(stringify(document))
  }

  dt2 = Date.now()
  ops = (iterations / (dt2 - dt1)) * 1000
  console.log(`Avarage ${ops} R/W ops per second`)

  dt1 = Date.now()
  for(let i = 0; i < iterations; i++) {
    const saveDocumentDeclaration = makeSaveDocument(pool, schema, 'AggId', 'Stories', document)
    await connection.query(saveDocumentDeclaration)
  }

  dt2 = Date.now()
  ops = (iterations / (dt2 - dt1)) * 1000
  console.log(`Avarage ${ops} write ops per second`)


  dt1 = Date.now()
  for(let i = 0; i < iterations; i++) {
    const loadDocumentDeclataion = makeLoadDocument(pool, schema, 'AggId', 'Stories')
    const rowList = await connection.query(loadDocumentDeclataion)

    const originalDocument = vivificateJsonBySchema(pool, schema, rowList, 'Stories')
  }

  dt2 = Date.now()
  ops = (iterations / (dt2 - dt1)) * 1000
  console.log(`Avarage ${ops} read ops per second`)

  process.exit(0)
}

main()