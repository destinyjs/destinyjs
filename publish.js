import getAggregateStates from './get-aggregate-states'
import createWriteTransaction from './create-write-transaction'

const publish = async (pool, events) => {
	const aggregateIds = new Set(events.map(
		({ aggregateId }) => aggregateId
	))
	const aggregateStates = await getAggregateStates(pool, aggregateIds)

	const transaction = await createWriteTransaction(pool)



	for(const writeModel of pool.writeModels) {
		for(const { aggregateId, type, payload } of events) {
			const {
				aggregateVersion,
				...state
			} = aggregateStates.get(aggregateId)

			transaction.saveEvent({
				aggregateId,
				aggregateVersion,
				type,
				payload
			})

		}
	}
	await transaction.commit()

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