import { act, render, waitFor } from "@testing-library/react-native"

import {
  createExportGuideRepository,
  type ExportGuideCatalogue,
  type ExportGuideLoadOutcome,
  type ExportGuideRepository,
} from "@/features/export-guides/data"
import { useImportDraft } from "@/features/onboarding/draft"

import ProviderSelectionScreen from "./provider-selection-screen"

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  Stack: { Screen: () => null },
}))
jest.mock("expo-image", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native")
  return { Image: View }
})
jest.mock("@/features/export-guides/data", () => ({
  ...jest.requireActual("@/features/export-guides/data"),
  createExportGuideRepository: jest.fn(),
}))
jest.mock("@/features/onboarding/draft", () => ({
  ...jest.requireActual("@/features/onboarding/draft"),
  useImportDraft: jest.fn(),
}))
jest.mock("./telemetry", () => ({
  attemptBucket: jest.fn(() => "1"),
  emitExportGuideEvent: jest.fn(),
}))

const mockCreateRepository = createExportGuideRepository as jest.Mock
const mockUseImportDraft = useImportDraft as jest.Mock

const catalogue: ExportGuideCatalogue = {
  schemaVersion: 1,
  catalogueVersion: "v1",
  locale: "en",
  providers: [
    {
      slug: "generic",
      label: "Generic",
      kind: "pages",
      selectable: true,
      compatibility: { minClientSchema: 1, maxClientSchema: 1 },
      pages: [{ title: "Export", description: "Open export." }],
    },
  ],
  rejectedProviders: {},
}

it("lets a real screen load survive its busy rerender", async () => {
  let resolve!: (outcome: ExportGuideLoadOutcome) => void
  let signal: AbortSignal | undefined
  const repository: ExportGuideRepository = {
    load: jest.fn(
      (request) =>
        new Promise((done) => {
          signal = request.signal
          resolve = done
        }),
    ),
  }
  mockCreateRepository.mockReturnValue(repository)
  const dispatch = jest.fn()
  const state = {
    phase: "draft" as const,
    draftRevision: 2,
    gateProgress: "programme" as const,
    draft: {
      institution: { kind: "unlisted" as const, schoolName: "School" },
      calendarName: "",
    },
  }
  mockUseImportDraft.mockReturnValue({ state, dispatch })

  const view = await render(<ProviderSelectionScreen />)
  expect(view.getByText("Loading the export guide…")).toBeTruthy()
  await view.rerender(<ProviderSelectionScreen />)
  expect(repository.load).toHaveBeenCalledTimes(1)
  expect(signal?.aborted).toBe(false)

  await act(async () => {
    resolve({ source: "network", catalogue })
    await Promise.resolve()
  })
  await waitFor(() =>
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "show-provider-selection" }),
    ),
  )
  expect(signal?.aborted).toBe(false)
  expect(mockCreateRepository).toHaveBeenCalledTimes(1)
})
