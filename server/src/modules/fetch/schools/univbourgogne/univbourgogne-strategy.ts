import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

const univbourgogneStrategy = new SchoolStrategy({
  school: "univbourgogne",
  /**
   * Remove default renamers because it doesn't return any events with nbWeeksRenamer
   */
  inheritGenericUrlRenamers: false,
})

export default univbourgogneStrategy
