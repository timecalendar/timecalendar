// Repo-local ESLint rules. Rationale per rule lives in its own file; the
// inventory is in docs/mobile/architecture-book/lint-format.md.
const noAdHocStatus = require("./no-ad-hoc-status")
const noJsCallInWorklet = require("./no-js-call-in-worklet")
const noRawButton = require("./no-raw-button")
const noRawTextInput = require("./no-raw-text-input")

module.exports = {
  rules: {
    "no-ad-hoc-status": noAdHocStatus,
    "no-js-call-in-worklet": noJsCallInWorklet,
    "no-raw-button": noRawButton,
    "no-raw-text-input": noRawTextInput,
  },
}
