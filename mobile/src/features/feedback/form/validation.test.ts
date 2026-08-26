import {
  isValidEmail,
  normalizeEmail,
  validateFeedbackForm,
} from "./validation"

describe("feedback validation", () => {
  it("normalizes and validates e-mail", () => {
    expect(normalizeEmail("  student@example.fr ")).toBe("student@example.fr")
    expect(isValidEmail("student@example.fr")).toBe(true)
    expect(isValidEmail("student@example")).toBe(false)
  })

  it("returns both required errors for whitespace-only values", () => {
    expect(validateFeedbackForm({ email: " ", message: "\n " })).toEqual({
      valid: false,
      errors: {
        email: "feedback.error.emailRequired",
        message: "feedback.error.messageRequired",
      },
    })
  })

  it("distinguishes an invalid e-mail", () => {
    expect(
      validateFeedbackForm({ email: "invalid", message: "Hello" }),
    ).toEqual({
      valid: false,
      errors: { email: "feedback.error.emailInvalid" },
    })
  })

  it("returns normalized valid values without altering the message", () => {
    expect(
      validateFeedbackForm({
        email: " student@example.fr ",
        message: " Hello ",
      }),
    ).toEqual({
      valid: true,
      values: { email: "student@example.fr", message: " Hello " },
    })
  })
})
