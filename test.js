import destiny from './destiny'

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
	await destiny(options).init()
	await destiny(options).publish(events)
}

main().catch(error=>console.error(error))


