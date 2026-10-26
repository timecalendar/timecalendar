import { fieldErrorHint } from "./field-error-hint"

it.each([
  ["Enter a URL", undefined, "Enter a URL"],
  [undefined, "Paste the link", "Paste the link"],
  ["Enter a URL", "Paste the link", "Enter a URL. Paste the link"],
  [undefined, undefined, undefined],
  ["", "Paste the link", "Paste the link"],
  ["", undefined, undefined],
  [null, "Paste the link", "Paste the link"],
  [null, undefined, undefined],
])("folds error %p and hint %p into %p", (error, hint, expected) => {
  expect(fieldErrorHint(error, hint)).toBe(expected)
})

it.each([
  [["Enter a name.", "Shown in the list."], "Enter a name. Shown in the list."],
  [["Bad", "Help", "Own"], "Bad. Help. Own"],
  [["Bad!", undefined, "Own"], "Bad! Own"],
  [[undefined, null, ""], undefined],
])("joins %p into %p without doubling punctuation", (parts, expected) => {
  const [error, ...hints] = parts
  expect(fieldErrorHint(error, ...hints)).toBe(expected)
})
