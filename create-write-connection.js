const createWriteConnection = (pool) => {
	return {
		beginTransaction: ()=>{},
		commitTransaction: ()=>{},
		close: ()=>{}
	}
}

export default createWriteConnection
