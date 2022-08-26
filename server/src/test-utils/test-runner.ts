import TestRunner from "jest-runner"

class SerialRunner extends TestRunner {
  constructor(globalConfig: any, context?: any) {
    super(globalConfig, context)
    ;(this as any).isSerial = true
  }
}

module.exports = SerialRunner
