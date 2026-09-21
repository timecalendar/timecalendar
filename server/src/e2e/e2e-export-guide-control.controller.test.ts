import {
  consumeE2eExportGuideFailure,
  E2eExportGuideControlController,
} from "./e2e-export-guide-control.controller"

describe("E2E export-guide control", () => {
  it("fails exactly one catalogue request", () => {
    const controller = new E2eExportGuideControlController()
    expect(controller.failNext()).toEqual({ armed: true })
    expect(consumeE2eExportGuideFailure()).toBe(true)
    expect(consumeE2eExportGuideFailure()).toBe(false)
  })
})
