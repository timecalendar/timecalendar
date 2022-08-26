import { NODE_ENV } from "config/constants"

export const isTestEnv = () => NODE_ENV === "test"
