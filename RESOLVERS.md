const LITERAL = name => {
  const mark = new String(name)
  mark.flag = Symbol()
  return mark
}

LITERAL``

db
  table(name)
    find(condition)
    extract(fields)
    sort(fields)
    skip(rows)
    limit(rows)

  join([tables], condition)
    skip(rows)
    limit(rows)
    
condition:
  ['fieldName1', operator, 'fieldName2']
  ['fieldName1', operator, 'constant'],

operator:
  '>', '<', '=', '<>', '<=', '<='
  'IN'
