import readApi from './read-api';

(async () => {
  const api = readApi();
  const result = await api.table('table').find({ test: 1 }).limit(3);
  console.log(result);
})();
