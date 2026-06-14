export class CustomError extends Error {
  payload: any

  constructor(message?: string, payload?: any) {
    super(message)

    this.name = "CustomError"
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError)
    }
    this.payload = payload
  }
}
