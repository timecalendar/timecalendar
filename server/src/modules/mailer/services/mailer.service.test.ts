import { join } from "path"
import { Logger } from "@nestjs/common"
import { Test } from "@nestjs/testing"
import { renderFile } from "ejs"
import { createTransport } from "nodemailer"
import { SMTP_FROM } from "config/constants"
import { MailerModule } from "modules/mailer/mailer.module"
import { MailerRecipient } from "modules/mailer/models/mailer-recipient.model"
import { AppMailerTemplate } from "modules/mailer/models/mailer-template.model"
import { MailerService } from "modules/mailer/services/mailer.service"

// `SMTP_URL` is a module-level const resolved at import time, and
// `setup-tests.ts` loads `server/.env` through dotenv before anything else — so
// its ambient value depends on whether the machine running the suite happens to
// have an SMTP entry in its `.env`. It is the condition every case below
// branches on, so each one forces it; otherwise the disabled-path assertions
// would pass trivially in CI and test the opposite path on a developer's box.
//
// It is read through a getter over a `mock`-prefixed variable: the prefix
// satisfies Jest's `jest.mock` hoisting guard, and the getter defers the read to
// call time (a plain reference would be evaluated while the factory runs, before
// the declaration is initialised). It is installed with `defineProperties`
// rather than declared in the returned literal because a getter spread
// alongside `requireActual` is downlevelled to `Object.assign`, which reads it
// back as a value at factory time — the same TDZ crash.
let mockSmtpUrl = ""

jest.mock("config/constants", () =>
  Object.defineProperties(
    { ...jest.requireActual("config/constants") },
    { SMTP_URL: { enumerable: true, get: () => mockSmtpUrl } },
  ),
)

const mockSendMail = jest.fn()

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}))

jest.mock("ejs", () => ({ renderFile: jest.fn() }))

// The repo ships no `.ejs` assets, so `renderTemplate`'s existence check would
// reject every template name. `fs.existsSync` is non-configurable and cannot be
// spied on, so make the one template this file uses resolvable at the module
// level and delegate every other path to the real implementation.
jest.mock("fs", () => {
  const actual = jest.requireActual("fs")
  return {
    ...actual,
    existsSync: (path: unknown) =>
      path === mockTemplatePath ? true : actual.existsSync(path),
  }
})

const createTransportMock = jest.mocked(createTransport)
const renderFileMock = jest.mocked(renderFile)

const CONFIGURED_URL = "smtp://mail.example.test:587"
const RECIPIENT: MailerRecipient = { email: "student@example.test" }
const TEMPLATE: AppMailerTemplate = {
  template: "welcome",
  data: { firstName: "Ada" },
}
// `MailerService.renderTemplate` resolves templates relative to its own
// directory, which is this file's directory. `mock`-prefixed so the `fs` mock
// factory above may close over it.
const mockTemplatePath = join(
  __dirname,
  "../../assets/templates/",
  "welcome.ejs",
)
const RENDERED_HTML = "<p>Bonjour Ada</p>"

describe("MailerService", () => {
  let warn: jest.SpyInstance

  beforeEach(() => {
    warn = jest.spyOn(Logger.prototype, "warn").mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe("without SMTP configured", () => {
    beforeEach(() => {
      mockSmtpUrl = ""
    })

    it("should compile MailerModule without constructing a transport", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [MailerModule],
      }).compile()

      expect(moduleRef.get(MailerService)).toBeInstanceOf(MailerService)
      expect(createTransportMock).not.toHaveBeenCalled()

      await moduleRef.close()
    })

    it("should skip the send, warn once and return undefined", async () => {
      const service = new MailerService()

      const result = await service.sendEmail(RECIPIENT, "Welcome", TEMPLATE)

      expect(result).toBeUndefined()
      expect(createTransportMock).not.toHaveBeenCalled()
      expect(mockSendMail).not.toHaveBeenCalled()
      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("SMTP_URL is not configured"),
      )
    })
  })

  describe("with SMTP configured", () => {
    beforeEach(() => {
      mockSmtpUrl = CONFIGURED_URL
      renderFileMock.mockResolvedValue(RENDERED_HTML)
    })

    it("should build the transport from SMTP_URL and send the rendered template", async () => {
      const sent = { messageId: "abc" }
      mockSendMail.mockResolvedValue(sent)
      const service = new MailerService()

      const result = await service.sendEmail(RECIPIENT, "Welcome", TEMPLATE)

      expect(createTransportMock).toHaveBeenCalledWith(CONFIGURED_URL)
      expect(renderFileMock).toHaveBeenCalledWith(
        mockTemplatePath,
        TEMPLATE.data,
        {},
      )
      expect(mockSendMail).toHaveBeenCalledWith({
        from: SMTP_FROM,
        to: RECIPIENT.email,
        subject: "Welcome",
        html: RENDERED_HTML,
      })
      expect(result).toBe(sent)
      expect(warn).not.toHaveBeenCalled()
    })

    it("should build the transport once and reuse it across sends", async () => {
      mockSendMail.mockResolvedValue({ messageId: "abc" })
      const service = new MailerService()

      await service.sendEmail(RECIPIENT, "Welcome", TEMPLATE)
      await service.sendEmail(RECIPIENT, "Welcome again", TEMPLATE)

      expect(createTransportMock).toHaveBeenCalledTimes(1)
      expect(mockSendMail).toHaveBeenCalledTimes(2)
    })

    it("should contain a delivery failure instead of propagating it", async () => {
      const error = new Error("connection refused")
      mockSendMail.mockRejectedValue(error)
      const service = new MailerService()

      const result = await service.sendEmail(RECIPIENT, "Welcome", TEMPLATE)

      expect(result).toBeUndefined()
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("Failed to send email"),
        error,
      )
    })
  })
})
