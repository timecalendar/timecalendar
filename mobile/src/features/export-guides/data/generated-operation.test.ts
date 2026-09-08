import { calendarControllerFindCalendarByToken } from "@/api/generated/calendars/calendars"
import { exportGuideV1ControllerFindCatalogue } from "@/api/generated/export-guides/export-guides"
import {
  type ApiResponse,
  customFetch,
  customFetchResponse,
} from "@/api/mutator"

jest.mock("@/api/mutator", () => ({
  customFetch: jest.fn(),
  customFetchResponse: jest.fn(),
}))

const responseMock = customFetchResponse as jest.MockedFunction<
  typeof customFetchResponse
>
const bodyMock = customFetch as jest.MockedFunction<typeof customFetch>

beforeEach(() => {
  responseMock.mockReset()
  bodyMock.mockReset()
})

it("routes only the generated export-guide operation through the response mutator", async () => {
  const expected = {
    status: 304,
    headers: new Headers({ ETag: '"generated-proof"' }),
    data: undefined,
  }
  responseMock.mockResolvedValueOnce(expected)
  bodyMock.mockResolvedValueOnce({ id: "calendar" })

  const result = await exportGuideV1ControllerFindCatalogue(
    {
      locale: "fr",
      clientSchema: 1,
      catalogueVersion: "distinct-version",
    },
    { headers: { "If-None-Match": '"request-proof"' } },
  )
  const responseProof: ApiResponse<unknown> = result
  expect(responseProof).toBe(expected)
  expect(responseMock).toHaveBeenCalledWith(
    "/v1/export-guides?locale=fr&clientSchema=1&catalogueVersion=distinct-version",
    expect.objectContaining({
      method: "GET",
      headers: { "If-None-Match": '"request-proof"' },
    }),
  )

  await calendarControllerFindCalendarByToken("token")
  expect(bodyMock).toHaveBeenCalledWith(
    "/calendars/by-token/token",
    expect.objectContaining({ method: "GET" }),
  )
})
