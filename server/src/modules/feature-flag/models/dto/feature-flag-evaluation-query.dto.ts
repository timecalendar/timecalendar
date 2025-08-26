import { IsString, IsNotEmpty } from "class-validator"

export class FeatureFlagEvaluationQueryDto {
  @IsString()
  @IsNotEmpty()
  keys: string
}
