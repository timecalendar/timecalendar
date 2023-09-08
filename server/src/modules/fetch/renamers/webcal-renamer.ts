import { ReplaceUrlRenamer } from "modules/fetch/renamers/replace-url-renamer"

/**
 * Replace the webcal protocol with https.
 */
const webcalRenamer = new ReplaceUrlRenamer(/^webcal:/, "https:")

export default webcalRenamer
