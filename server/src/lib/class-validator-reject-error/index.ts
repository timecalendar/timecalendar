import {
  ValidationError,
  ValidatorOptions,
  validateOrReject,
} from "class-validator"

export class AppValidationError extends Error {
  constructor(public readonly errors: ValidationError[]) {
    super("Validation failed")
  }
}

export const validateOrRejectWithError = async (
  object: object,
  validatorOptions?: ValidatorOptions,
) => {
  try {
    await validateOrReject(object, validatorOptions)
  } catch (err) {
    throw new AppValidationError(err)
  }
}
