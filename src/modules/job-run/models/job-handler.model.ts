import { JobRunContext } from "modules/job-run/models/job-run-context.model"

export type JobHandler<T> = (context: JobRunContext<T>) => Promise<any>
