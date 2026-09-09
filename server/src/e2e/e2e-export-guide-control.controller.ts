import { Controller, Post } from "@nestjs/common"
import { ApiExcludeController } from "@nestjs/swagger"

let failNextCatalogueRequest = false

export const consumeE2eExportGuideFailure = (): boolean => {
  if (!failNextCatalogueRequest) return false
  failNextCatalogueRequest = false
  return true
}

export const resetE2eExportGuideFailure = (): void => {
  failNextCatalogueRequest = false
}

@ApiExcludeController()
@Controller("__e2e/export-guide")
export class E2eExportGuideControlController {
  @Post("fail-next")
  failNext(): { armed: true } {
    failNextCatalogueRequest = true
    return { armed: true }
  }
}
