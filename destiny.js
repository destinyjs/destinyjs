import init from './init'
import publish from './publish'

export default (pool) => ({
	init: init.bind(null, pool),
	publish: publish.bind(null, pool)
})