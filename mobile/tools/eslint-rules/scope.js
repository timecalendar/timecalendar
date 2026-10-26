function findVariable(scope, name) {
  for (let current = scope; current; current = current.upper) {
    const variable = current.set.get(name)
    if (variable) {
      return variable
    }
  }
  return null
}

module.exports = { findVariable }
