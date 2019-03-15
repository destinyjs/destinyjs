import destiny from './destiny'
import {S} from './read-api'

const options = {
	writeModels: [
		{
			name: 'Футболки',
			schema: {
				items: ['string']
			},
			reducer: (state = { items: [] }, event) => {
				state.items.push(JSON.stringify(event))
				return state
			}
		}

	],
	connection: {
		host: 'localhost',
		port: 3307,
		user: 'root',
		password: 'pwd',
		database: 'qqq'
	}
}

const events = [
	{
		aggregateId: 'Тула',
		type: 'ФУТБОЛКА_ИЗГОТОВЛЕНА',
		payload: {
			id: 'id1',
			size: 'L'
		}
	},
	{
		aggregateId: 'Тула',
		type: 'ФУТБОЛКА_ОТПРАВЛЕНА',
		payload: {
			id: 'id1',
			size: 'L'
		}
	},
	{
		aggregateId: 'Калуга',
		type: 'ФУТБОЛКА_ПОЛУЧЕНА',
		payload: {
			id: 'id1',
			size: 'L'
		}
	}
]

const main = async () => {
	const application = destiny(options)

	await application.init()
	await application.publish(events)
	// await application
	// 	.api
  //   .table('Stories', schema)
  //   .find([
  //     ['a.ab', '=', S`Qwerty`]
  //   ]);
}

main().catch(error=>console.error(error))


