import mysql from 'mysql2';

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
      return await continuation(...args)
    }
  })

const getSearchApi = (connection, tableName) => {
  let promiseResolve = null,
      promiseReject = null;

  const promise = new Promise((resolve, reject) => {
    promiseResolve = resolve
    promiseReject = reject
  })
  const pool = { promise }

  const init = ({ findCondition, extractFields, sortFields, limitRows, skipRows }) =>
    new Promise((resolve, reject) => {
      const fields = [
        extractFields == null ? '*' : extractFields,
        tableName
      ];

      let conditionPart = '';

      if (findCondition != null) {
        const conditionParts = [];

        for (const [left, operator, right] of findCondition) {
          conditionParts.push('??', operator);

          if (typeof right === 'string' && !right.isLiteral) {
            conditionParts.push('??');
          } else {
            conditionParts.push('?');
          }

          fields.push(left, operator, right);
        }

        conditionPart = ` WHERE ${conditionParts.join(' ')}`
      }

      let sortPart = ''

      if (sortFields != null) {
        const sortParts = [];

        for (const fieldName in sortFields) {
          if (!sortFields.hasOwnProperty(fieldName)) {
            continue;
          }

          if (sortFields[fieldName] === -1) {
            sortParts.push('?? DESC');
          } else {
            sortParts.push('?? ASC');
          }

          fields.push(fieldName);
        }

        sortPart = ` ORDER BY ${sortParts.join(', ')}`;
      }

      let limitPart = '';

      if (limitRows != null) {
        limitPart = 'LIMIT = ?';
        fields.push(limitRows);
      }

      let skipPart = '';

      if (skipRows != null) {
        skipPart = 'OFFSET = ?';
        fields.push(skipRows);
      }

      const query = [
        'SELECT ?? FROM ??',
        conditionPart,
        sortPart,
        limitPart,
        skipPart
      ].join();

      connection.query(query, fields, (error, rows) => {
        if (error) {
          reject(error);
        } else {
          resolve(rows);
        }
      });
    });

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

  promise[symbol].initPromise.then(init.bind(null, pool))

  const promiseThen = promise.then.bind(promise)
  const promiseCatch = promise.catch.bind(promise)

  promise.then = promise[symbol].initResolve.bind(null, promiseThen)
  promise.catch = promise[symbol].initResolve.bind(null, promiseCatch)

  return promise
};

const getDbApi = (connectionParams) => {
  // const connection = mysql.createConnection(connectionParams);

  return {
    table(name) {
      return getSearchApi(null, name);
    }
  }
};

export {
  getDbApi as default,
  S
}
