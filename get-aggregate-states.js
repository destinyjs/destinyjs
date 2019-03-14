const getAggregateStates = async (pool, aggregateIds) => {
	const states = new Map()

	for(const aggregateId of aggregateIds) {
		states.set(aggregateId, {})
	}

	return states
}

export default getAggregateStates