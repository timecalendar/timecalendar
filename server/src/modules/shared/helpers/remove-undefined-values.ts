export const removeUndefinedValues = (
  obj: Record<string, string | undefined>,
): Record<string, string> => {
  obj = { ...obj }
  Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key])
  return obj as Record<string, string>
}
