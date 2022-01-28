import { Inject } from "@nestjs/common"
import { SCHOOL_STRATEGIES } from "modules/fetch/constants"

export const InjectStrategies = () => Inject(SCHOOL_STRATEGIES)
