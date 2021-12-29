import { Inject } from "@nestjs/common"
import { SCHOOL_STRATEGIES } from "../constants"

export const InjectStrategies = () => Inject(SCHOOL_STRATEGIES)
