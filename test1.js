import createApi, { S } from './read-api';

(async () => {
  const api = createApi({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'testDatabase'
  });

  const result = await api
    .table('testTable')
    .find([
      ['a', '=', `b`]
    ])
    .sort({
      a: -1
    })
    .limit(3)
    .skip(5);

  console.log('result', result);
})();
