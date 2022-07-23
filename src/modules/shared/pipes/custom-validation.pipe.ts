import { ValidationPipe, ArgumentMetadata, Injectable } from "@nestjs/common"

export const REWRITE_VALIDATION_OPTIONS = "REWRITE_VALIDATION_OPTIONS"

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  async transform(value: any, metadata: ArgumentMetadata) {
    const options = Reflect.getMetadata(
      REWRITE_VALIDATION_OPTIONS,
      (metadata as any).metatype,
    )
    let originOptions: any
    if (options) {
      originOptions = { ...this.validatorOptions }
      this.validatorOptions = Object.assign(this.validatorOptions, options)
    }
    const result = super.transform(value, metadata)
    if (originOptions) {
      this.validatorOptions = originOptions
    }
    return result
  }
}
