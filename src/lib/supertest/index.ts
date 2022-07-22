import { NestExpressApplication } from "@nestjs/platform-express"
import supertestRequest from "supertest"

const request = (app: NestExpressApplication) =>
  supertestRequest(app.getHttpServer())

export default request
