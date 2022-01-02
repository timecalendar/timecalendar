import { NestExpressApplication } from "@nestjs/platform-express"
import { TestingModule } from "@nestjs/testing"
import configureMainApp from "src/config/configure-main-app"

const appInstances: NestExpressApplication[] = []

export const createNestTestApp = async (module: TestingModule) => {
  const app = module.createNestApplication<NestExpressApplication>()
  configureMainApp(module, app)
  await app.init()
  appInstances.push(app)
  return app
}

export const getNestTestApps = () => appInstances

export const clearNestTestApps = () =>
  Promise.all(appInstances.map((app) => app.close()))
