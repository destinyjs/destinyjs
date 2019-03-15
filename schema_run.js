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

  const tablesDeclaration = makeCreateTableBySchema(schema, 'Stories')
  await connection.query(tablesDeclaration)

  const saveDocumentDeclaration = makeSaveDocument(schema, 'AggId', 'Stories', document)
  await connection.query(saveDocumentDeclaration)

  const loadDocumentDeclataion = makeLoadDocument(schema, 'AggId', 'Stories')
  const rowList = await connection.query(loadDocumentDeclataion)

  const originalDocument = vivificateJsonBySchema(schema, rowList, 'Stories')
  console.log(stringify(originalDocument))
  console.log(stringify(document))
}

main()