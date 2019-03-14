import getAggregateStates from './get-aggregate-states'
import createConnection from './create-connection'

const publish = async (pool, events) => {
	const aggregateIds = new Set(events.map(
		({ aggregateId }) => aggregateId
	))
	const aggregateStates = await getAggregateStates(pool, aggregateIds)

	const connection = await createConnection(pool)

	await connection.beginTransaction()

	for(const writeModel of pool.writeModels) {
		for(const { aggregateId, type, payload } of events) {
			const {
				aggregateVersion,
				...state
			} = aggregateStates.get(aggregateId)

		}
	}

	await connection.commitTransaction()

	await connection.close()

	// // beginTransaction
	// // 1. write events to table "eventStore"
	// for(const {
	// 	aggregateId,
	// 	aggregateVersion,
	// 	nextAggregateVersion,
	// 	state,
	// 	projectionName,
	// 	projectionSchema
	// } of items) {
	// 	// 2. convert JSON state by schema to create/findAndUpdate operations on  language.
	// 	// findAndUpdate({ $where: { aggregateId, aggregateVersion } })
	// 	// 3. write operations to table ${projectionName}
	// }
	// // endTransaction




	// for(const { aggregateId } of events) {
	// 	const
	// }
}

export default publish