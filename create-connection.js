const createConnection = (pool) => {
	return {
		beginTransaction: ()=>{},
		commitTransaction: ()=>{},
		close: ()=>{}
	}
}

export default createConnection
