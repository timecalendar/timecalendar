// Repo-local ESLint rules. Rationale per rule lives in its own file; the
// inventory is in docs/mobile/architecture-book/lint-format.md.
const noAdHocHeaderAction = require("./no-ad-hoc-header-action")
const noAdHocSeparator = require("./no-ad-hoc-separator")
const noAdHocStatus = require("./no-ad-hoc-status")
const noJsCallInWorklet = require("./no-js-call-in-worklet")
const noRawButton = require("./no-raw-button")
const noRawEventColor = require("./no-raw-event-color")
const noRawPrimitive = require("./no-raw-primitive")
const noRawRadioGroup = require("./no-raw-radio-group")
const noRawTextInput = require("./no-raw-text-input")
const noStyleLiterals = require("./no-style-literals")
const noSwiftuiContainerIdentifier = require("./no-swiftui-container-identifier")
const noRetiredListNames = require("./no-retired-list-names")

module.exports = {
  rules: {
    "no-ad-hoc-header-action": noAdHocHeaderAction,
    "no-ad-hoc-separator": noAdHocSeparator,
    "no-ad-hoc-status": noAdHocStatus,
    "no-js-call-in-worklet": noJsCallInWorklet,
    "no-raw-button": noRawButton,
    "no-raw-event-color": noRawEventColor,
    "no-raw-primitive": noRawPrimitive,
    "no-raw-radio-group": noRawRadioGroup,
    "no-raw-text-input": noRawTextInput,
    "no-style-literals": noStyleLiterals,
    "no-swiftui-container-identifier": noSwiftuiContainerIdentifier,
    "no-retired-list-names": noRetiredListNames,
  },
}
