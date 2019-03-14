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
			}
		}

	],
	connection: {
		host:'localhost',
		user: 'root',
		database: 'test'
	},
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

destiny(options).publish(events)