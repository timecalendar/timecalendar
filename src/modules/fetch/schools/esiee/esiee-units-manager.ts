import { ESIEE_SCHOOL } from "modules/fetch/schools/esiee/esiee.constants"
import { appFirestore } from "modules/storage/firestore"

type UnitsMap = { [code: string]: string }

export class EsieeUnitsManager {
  private units: UnitsMap = {}

  constructor() {
    this.load()
  }

  private load() {
    appFirestore.get(
      [ESIEE_SCHOOL, "units"].join("_"),
      {} as UnitsMap,
      (units) => {
        this.units = units
      },
    )
  }

  /**
   * Returns a unit name by the ESIEE unit code (e.g. 3A-SH1)
   */
  getUnitNameByCode(code: string): string | null {
    return this.units[code] ?? null
  }
}

export const esieeUnitsManager = new EsieeUnitsManager()
