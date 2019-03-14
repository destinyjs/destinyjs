import getAggregateStates from './get-aggregate-states'
import createWriteTransaction from './create-write-transaction'

const publish = async (pool, events) => {
	const aggregateIds = new Set(events.map(
		({ aggregateId }) => aggregateId
	))
	const aggregateStates = await getAggregateStates(pool, aggregateIds)

	const transaction = createWriteTransaction(pool)

	for(const writeModel of pool.writeModels) {
		for(const { aggregateId, type, payload } of events) {
			aggregateStates.get(aggregateId).aggregateVersion++

			const {
				aggregateVersion,
				state
			} = aggregateStates.get(aggregateId)

			transaction.saveEvent({
				aggregateId,
				aggregateVersion,
				type,
				payload
			})

			const nextState = writeModel.reducer(state, events)

			//transaction.saveAggregateState(writeModel.name, {})

			console.log(nextState)
		}
	}

	await transaction.commit()
}

export default publish