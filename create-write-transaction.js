import mysql from 'mysql2/promise'
import { escapeId, escape } from 'mysql2'

import getSQLQueryByJSON from './get-sql-query-by-json'

const createWriteTransaction = (pool) => {
	const { eventsTableName = 'events' } = pool
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
					escapeId(eventsTableName)
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

			queries.push('COMMIT')

			const query = queries.join(';\n')
			console.log(
				query
			)

			await connection.query(query)

			await connection.close()
		}
	}
}

export default createWriteTransaction
