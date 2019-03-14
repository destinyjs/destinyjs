import mysql from 'mysql2/promise'
import { escapeId, escape } from 'mysql2'

const init = async (pool) => {
	const { eventsTableName = 'events' } = pool
	const Promise = pool.Promise || global.Promise

	const connection = await mysql.createConnection({
		...pool.connection,
		multipleStatements: true,
		Promise
	})

	const queries = []

	// TODO. delete
	queries.push(
		`DROP TABLE IF EXISTS ${escapeId(eventsTableName)}`
	)
	//




	queries.push(
		`CREATE TABLE ${
			escapeId(eventsTableName)
		} (${
			escapeId('aggregateId')
		} VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, ${
			escapeId('aggregateVersion')
		} INTEGER, ${
			escapeId('type')
		} VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, ${
			escapeId('payload')
		} VARCHAR(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)`
	)

// , INDEX ${
// 			escapeId('aggregateId')
// 		} (${escapeId('aggregateId')})

	const query = queries.join(';\n')

	console.log(query)

	await connection.query(query)

	await connection.close()
}

export default init
