import { makeLoadDocument, vivificateJsonBySchema } from './schema'

const getAggregateStates = async (pool, aggregateIds) => {
	const states = new Map()

	for(const aggregateId of aggregateIds) {
		makeLoadDocument(schema, aggregateId, baseTableName)

		states.set(aggregateId, { aggregateVersion: 0 })
	}

	return states
}

export default getAggregateStates