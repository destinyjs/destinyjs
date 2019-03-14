db
  table(name)
    find(condition)
    extract(fields)
    sort(fields)
    skip(rows)
    limit(rows)
    groupBy(aggregate)
    having(condition)

  join([tables], condition)
    skip(rows)
    limit(rows)
    groupBy(aggregate)
    having(condition)
    
condition:
  ['fieldName1', operator, 'fieldName2']
  ['fieldName1', operator, 'constant']

operator:
  '>', '<', '=', '<>', '<=', '<='
  'IN'