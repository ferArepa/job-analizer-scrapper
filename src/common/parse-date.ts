

export function parseDate(date: Date):string {

  let parsedDate = JSON.stringify(date).replaceAll(':', "-").replaceAll('.', "-").replaceAll('{', "").replaceAll('}', "")
  parsedDate = parsedDate.replace(/"/g, '')
  return parsedDate
}