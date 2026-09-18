// Repo-local ESLint rules. Rationale per rule lives in its own file; the
// inventory is in docs/mobile/architecture-book/lint-format.md.
const noJsCallInWorklet = require("./no-js-call-in-worklet")

module.exports = {
  rules: {
    "no-js-call-in-worklet": noJsCallInWorklet,
  },
}
