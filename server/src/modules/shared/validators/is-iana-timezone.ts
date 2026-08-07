import { registerDecorator, ValidationOptions } from "class-validator"

export const isIanaTimezone = (value: unknown): boolean => {
  if (typeof value !== "string" || value.length === 0) return false
  try {
    new Intl.DateTimeFormat("en", { timeZone: value })
    return true
  } catch {
    return false
  }
}

export function IsIanaTimezone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isIanaTimezone",
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a valid IANA timezone`,
        ...validationOptions,
      },
      validator: { validate: isIanaTimezone },
    })
  }
}
