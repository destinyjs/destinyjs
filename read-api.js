import mysql, { escape, escapeId } from 'mysql2';
import { unflatten } from 'flat';

import { makeLoadDocument, getTablesBySchema } from './schema'

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
    return escapeId(field, true);
  }

  return escape(field);
};

const getSearchApi = (connection, tableName, schema) => {
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
        const allTableNames = getTablesBySchema(schema, tableName);

        const queryParts = [
          'SELECT',
          allTableNames.map(name => `${escapeId(name, true)}.*`),
          // extractFields == null ? '*' : extractFields.map(escapeId).join(', '),
          'FROM',
          allTableNames.map(name => escapeId(name, true)).join(', ')
        ];

        const findParts = [];

        for (const name of allTableNames) {
          if (name === tableName) {
            continue;
          }

          findParts.push([
            `${escapeId(tableName, true)}.${escapeId('AggregateId')}`,
            '=',
            `${escapeId(name, true)}.${escapeId('AggregateId')}`
          ].join(' '));
        }
        
        if (Array.isArray(findCondition) && findCondition.length > 0) {
          for (const [left, operator, right] of findCondition) {
            if (Array.isArray(right)) {
              const list = right
                .map(normalizeField)
                .join(', ');

              findParts.push(`${escapeId(tableName, true)}.${escapeId(left, true)} ${operator} (${list})`);
            } else {
              findParts.push(`${escapeId(tableName, true)}.${escapeId(left, true)} ${operator} ${normalizeField(right)}`);
            }
          }
        }

        if (findParts.length > 0) {
          queryParts.push('WHERE', findParts.join(' AND '));
        }

        if (sortFields != null) {
          queryParts.push('ORDER BY');

          for (const fieldName in sortFields) {
            if (!sortFields.hasOwnProperty(fieldName)) {
              continue;
            }

            queryParts.push(`${escapeId(fieldName, true)} ${sortFields[fieldName] === -1 ? 'DESC' : 'ASC'}`);
          }
        }

        if (limitRows != null) {
          queryParts.push(`LIMIT ${escape(limitRows)}`);
        }

        if (skipRows != null) {
          queryParts.push(`OFFSET ${escape(skipRows)}`);
        }

        queryParts.push(';');
        const sql = queryParts.join(' ');

        connection.query(sql, (error, rows) => {
          if (error) {
            reject(error);
          } else {
            resolve(rows.map(row => unflatten(row)));
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
    table(name, schema) {
      return getSearchApi(connection, name, schema);
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
