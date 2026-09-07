export class ExportGuideValidationError extends Error {
  constructor(code: string) {
    super(code)
    this.name = "ExportGuideValidationError"
  }
}
