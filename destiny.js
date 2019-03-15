import init from './init'
import publish from './publish'
import createApi, { S } from './read-api'
import {
  numberType,
  stringType,
  boolType,
  dateType
} from './schema'

export default (pool) => ({
	init: init.bind(null, pool),
	publish: publish.bind(null, pool),
	api: createApi(pool.connection)
})

export {
	S,
	numberType,
  stringType,
  boolType,
  dateType
}