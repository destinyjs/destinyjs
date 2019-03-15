import destiny, { S, boolType, dateType, numberType, stringType } from './destiny'

const options = {
	writeModels: [
		{
			name: 'Building',
			schema: {
				id: stringType,
				address: {
					city: stringType,
					street: stringType,
					house: stringType
				},
				price: numberType,
				isSoldOut: boolType,
				auctionStartDate: dateType,
				auctionFinishDate: dateType,
			},
			reducer: (state, event) => {
				switch (event.type) {
					case 'BUILDING_OFFERED_FOR_SALE': {
						state = {
							id: event.aggregateId,
							address: {
								city: event.payload.address.city,
								street: event.payload.address.street,
								house: event.payload.address.house,
							},
							price: event.payload.price,
							isSoldOut: false,
							auctionStartDate: new Date(event.timestamp),
							auctionFinishDate: null
						}
						break;
					}
					case 'BUILDING_AUCTION_FINISHED': {
						state.auctionFinishDate = new Date(event.timestamp)
						break;
					}
					case 'BUILDING_BET_INCREASED': {
						if(event.payload.price > state.price) {
							state.price = event.payload.price
						} else {
							throw new Error('Bet rejected')
						}
						break
					}
				}
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
}

main().catch(error=>console.error(error))



