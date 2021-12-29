import { ReplaceUrlRenamer } from "./replace-url-renamer"

/**
 * Change the nbWeeks parameter in the ADE URLs to a period.
 *
 * This is a workaround for an ADE bug that generates a URL for the next
 * 4 weeks, even if a longer period was selected during export.
 */
const nbWeeksRenamer = new ReplaceUrlRenamer(
  /&nbWeeks=[0-9]+/,
  "&firstDate=2000-01-01&lastDate=2038-01-01",
)

export default nbWeeksRenamer
