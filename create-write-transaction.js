import mysql from 'mysql2/promise'
import { escapeId, escape } from 'mysql2'

import getSQLQueryByJSON from './get-sql-query-by-json'

const createWriteTransaction = (pool) => {
	const Promise = pool.Promise || global.Promise

	const connectionPromise = mysql.createConnection({
		...pool.connection,
		multipleStatements: true,
		Promise
	})

	const queries = [
		'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE',
		'START TRANSACTION'
	]

	return {
		saveEvent: ({ aggregateId, aggregateVersion, type, payload })=>{
			queries.push(
				`INSERT INTO ${
					escapeId('events')
				} (${
					escapeId('aggregateId')
				}, ${
					escapeId('aggregateVersion')
				}, ${
					escapeId('type')
				}, ${
					escapeId('payload')
				}) VALUES (${
					escape(aggregateId)
				}, ${
					escape(aggregateVersion)
				}, ${
					escape(type)
				}, ${
					escape(JSON.stringify(payload))
				})`
			)
		},
		saveAggregateState: (tableName, aggregateState) => {
			queries.push(getSQLQueryByJSON(pool, tableName, aggregateState))
		},
		commit: async () => {
			const connection = await connectionPromise

			queries.push('COMMIT TRANSACTION')

			const query = queries.join(';\n')
			console.log(
				query
			)

			await connection.query(query)

		}
	}
}

export default createWriteTransaction
