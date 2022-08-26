import { Factory } from "fishery"

export class AppFactory<T, I = any, C = T> extends Factory<T, I, C> {}
