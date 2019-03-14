import getAggregateStates from './get-aggregate-states'

const publish = async (pool, events) => {
	const eventCount = events.length
	const aggregateIds = new Set(events.map(
		({ aggregateId }) => aggregateId
	))
	const aggregateStates = await getAggregateStates(pool, aggregateIds)

	for(let eventIndex = 0; eventIndex < eventCount; eventIndex++) {
		const event = events[eventIndex]
		const { aggregateId } = event
		const {
			aggregateVersion,
			...state
		} = aggregateStates.get(aggregateId)


	}

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