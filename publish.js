import getAggregateStates from './get-aggregate-states'

const publish = async (pool, events) => {
	const count = events.length
	const aggregateIds = events.map(
		({ aggregateId }) => aggregateId
	)
	const aggregateStates = await getAggregateStates(pool, aggregateIds)


	// for(const { aggregateId } of events) {
	// 	const
	// }
}

export default publish