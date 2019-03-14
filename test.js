import destiny from './destiny'

const options = {
	connection: {},
	schema: {}
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