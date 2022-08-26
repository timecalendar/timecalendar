const ensureNotNull = <T>(arg: T | null): T => {
  if (arg === null) throw new Error(`Value is null`)
  return arg
}

export default ensureNotNull
