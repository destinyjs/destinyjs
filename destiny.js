import publish from './publish'

export default (pool) => ({
	publish: publish.bind(null, pool)
})