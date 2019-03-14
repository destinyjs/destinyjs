import mysql, { escape, escapeId } from 'mysql2';

const symbol = Symbol()

const S = name => {
  const result = new String(name);
  result.isLiteral = true;
  return result;
};

const getInitPromise = ({ promise }) =>
  new Promise(initResolve => {
    promise[symbol].initResolve = async (continuation, ...args) => {
      initResolve()
      const result = await continuation(...args)
      return result;
    }
  })

const normalizeField = field => {
  if (field.isLiteral) {
    return escape(field.toString());
  }

  if (typeof field === 'string') {
    return escapeId(field);
  }

  return escape(field);
};

const getSearchApi = (connection, tableName) => {
  let promiseResolve = null,
      promiseReject = null;

  const promise = new Promise((resolve, reject) => {
    promiseResolve = resolve
    promiseReject = reject
  })
  const pool = { promise }

  const init = async ({ promise }) => {
    try {
      const result = await new Promise((resolve, reject) => {
        const { extractFields, findCondition, sortFields, limitRows, skipRows } = promise[symbol];

        const queryParts = [
          'SELECT',
          extractFields == null ? '*' : extractFields.map(escapeId).join(', '),
          'FROM',
          escapeId(tableName)
        ];

        if (Array.isArray(findCondition) && findCondition.length > 0) {
          const findParts = [];

          for (const [left, operator, right] of findCondition) {
            if (Array.isArray(right)) {
              const list = right
                .map(normalizeField)
                .join(', ');

              findParts.push(`${escapeId(left)} ${operator} (${list})`);
            } else {
              findParts.push(`${escapeId(left)} ${operator} ${normalizeField(right)}`);
            }
          }

          queryParts.push('WHERE', findParts.join(' AND '));
        }

        if (sortFields != null) {
          queryParts.push('ORDER BY');

          for (const fieldName in sortFields) {
            if (!sortFields.hasOwnProperty(fieldName)) {
              continue;
            }

            queryParts.push(`${escapeId(fieldName)} ${sortFields[fieldName] === -1 ? 'DESC' : 'ASC'}`);
          }
        }

        if (limitRows != null) {
          queryParts.push(`LIMIT ${escape(limitRows)}`);
        }

        if (skipRows != null) {
          queryParts.push(`OFFSET ${escape(skipRows)}`);
        }

        queryParts.push(';');
        const query = queryParts.join(' ');

        connection.query(query, (error, rows) => {
          if (error) {
            reject(error);
          } else {
            resolve(rows);
          }
        });
      });
      
      promise[symbol].resolve(result);
    } catch (e) {
      promise[symbol].reject(e);
    }
  };

  promise[symbol] = Object.create(null)
  promise[symbol].resolve = promiseResolve
  promise[symbol].reject = promiseReject
  promise[symbol].initPromise = getInitPromise(pool)

  promise.find = condition => { 
    promise[symbol].findCondition = condition;
    return promise
  }

  promise.extract = fields => {
    promise[symbol].extractFields = fields;
    return promise
  }

  promise.sort = fields => {
    promise[symbol].sortFields = fields;
    return promise
  }

  promise.skip = rows => {
    promise[symbol].skipRows = rows;
    return promise;
  }

  promise.limit = rows => {
    promise[symbol].limitRows = rows;
    return promise
  }

  promise.groupBy = aggregate => {
    promise[symbol].groupAggregate = aggregate;
    return promise;
  }

  promise.having = condition => {
    promise[symbol].havingCondition = condition;
    return promise
  }

  promise[symbol].initPromise.then(() => init(pool));

  const promiseThen = promise.then.bind(promise)
  const promiseCatch = promise.catch.bind(promise)

  promise.then = promise[symbol].initResolve.bind(null, promiseThen)
  promise.catch = promise[symbol].initResolve.bind(null, promiseCatch)

  return promise
};

const getDbApi = (connectionParams) => {
  const connection = mysql.createConnection(connectionParams);

  return {
    table(name) {
      return getSearchApi(connection, name);
    },
    async close() {
      await connection.close();
    }
  }
};

export {
  getDbApi as default,
  S
}
