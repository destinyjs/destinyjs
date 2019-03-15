import createApi, { S } from './read-api';

import {
  numberType,
  stringType,
  boolType,
  dateType
} from './schema'

const schema = {
  a: {
    aa: numberType,
    ab: stringType
  },
  b: {
      ba: numberType,
      bb: stringType,
      bc: {
        bca: numberType,
        bcb: stringType
      }
  },
  c: boolType,
  d: dateType
}

;(async () => {
  const api = createApi({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'hk'
  });

  const result = await api
    .table('Stories', schema)
    .find([
      ['a.ab', '=', S`Qwerty`]
    ]);
    
  console.log('result', result);

  await api.close();
})();
