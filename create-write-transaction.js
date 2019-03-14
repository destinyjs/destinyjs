const mysql = require('mysql2/promise');
import { escapeId, escape } from 'mysql2'

const createWriteTransaction = (pool) => {
	const queries = [
	]

	return {
		saveEvent: ({ aggregateId, aggregateVersion, type, payload })=>{
			queries.push(
				`INSERT INTO ${
					escapeId('events')
				} (aggregateId, aggregateVersion, type, payload) ` +
				` VALUES (${
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
		commit: ()=>{
			console.log(
				JSON.stringify(queries, null, 2)
			)
		}
	}
}

export default createWriteTransaction
