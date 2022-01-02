import _ from "lodash"

export function getObjectPaths(obj: any, parentKey?: any) {
  let result: any
  if (_.isArray(obj)) {
    let idx = 0
    result = _.flatMap(obj, function (obj: any) {
      return getObjectPaths(obj, `${parentKey || ""}[${idx++}]`)
    })
  } else if (_.isPlainObject(obj)) {
    result = _.flatMap(_.keys(obj), function (key: any) {
      return _.map(getObjectPaths(obj[key], key), function (subkey: any) {
        return (parentKey ? `${parentKey}.` : "") + subkey
      })
    })
  } else {
    result = []
  }
  return _.concat(result, parentKey || [])
}
