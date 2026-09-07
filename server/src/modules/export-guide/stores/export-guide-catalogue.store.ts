import { Injectable } from "@nestjs/common"
import {
  ExportGuideBundle,
  ExportGuideSnapshot,
} from "modules/export-guide/models/export-guide.model"
import {
  createInitialExportGuideCatalogue,
  INITIAL_EXPORT_GUIDE_VERSION,
} from "modules/export-guide/data/initial-export-guide-catalogue"
import { ExportGuideCatalogueValidator } from "modules/export-guide/validation/export-guide-catalogue.validator"
import { ExportGuideValidationError } from "modules/export-guide/validation/export-guide-validation.error"

const immutableMap = <K, V>(
  entries: Iterable<readonly [K, V]>,
): ReadonlyMap<K, V> => {
  const map = new Map(entries)
  return Object.freeze(
    new Proxy(map, {
      get(target, property) {
        if (property === "set" || property === "delete" || property === "clear")
          return () => {
            throw new ExportGuideValidationError("snapshot_immutable")
          }
        const value = Reflect.get(target, property, target)
        return typeof value === "function" ? value.bind(target) : value
      },
    }),
  )
}

@Injectable()
export class ExportGuideCatalogueStore {
  private snapshot: ExportGuideSnapshot
  private readonly staged = new Map<string, ExportGuideBundle>()

  constructor(validator: ExportGuideCatalogueValidator) {
    const catalogues = validator.validatePair(
      createInitialExportGuideCatalogue("fr"),
      createInitialExportGuideCatalogue("en"),
      { initial: true },
    )
    const initial: ExportGuideBundle = Object.freeze({
      catalogueVersion: INITIAL_EXPORT_GUIDE_VERSION,
      catalogues,
      publishedAt: new Date(0),
    })
    this.snapshot = Object.freeze({
      activeVersion: INITIAL_EXPORT_GUIDE_VERSION,
      active: initial,
      retained: immutableMap([[INITIAL_EXPORT_GUIDE_VERSION, initial]]),
    })
  }

  capture(): ExportGuideSnapshot {
    return this.snapshot
  }

  find(version?: string): ExportGuideBundle | undefined {
    const snapshot = this.capture()
    return version ? snapshot.retained.get(version) : snapshot.active
  }

  stage(bundle: ExportGuideBundle): void {
    if (
      this.snapshot.retained.has(bundle.catalogueVersion) ||
      this.staged.has(bundle.catalogueVersion)
    )
      throw new ExportGuideValidationError("version_exists")
    this.staged.set(bundle.catalogueVersion, bundle)
  }

  commitStaged(version: string): void {
    const bundle = this.staged.get(version)
    if (!bundle) throw new ExportGuideValidationError("version_missing")
    this.snapshot = Object.freeze({
      activeVersion: version,
      active: bundle,
      retained: immutableMap(
        new Map(this.snapshot.retained).set(version, bundle).entries(),
      ),
    })
    this.staged.delete(version)
  }

  discardStaged(version: string): void {
    this.staged.delete(version)
  }

  activate(version: string): void {
    const retained = this.snapshot.retained.get(version)
    if (!retained) throw new ExportGuideValidationError("version_missing")
    this.snapshot = Object.freeze({
      activeVersion: version,
      active: retained,
      retained: this.snapshot.retained,
    })
  }

  prune(
    now: Date,
    cacheAgeMs: number,
    referencedVersions: ReadonlySet<string>,
  ): string[] {
    const threshold = 24 * 60 * 60 * 1000 + cacheAgeMs
    const retained = new Map(this.snapshot.retained)
    const removed: string[] = []
    for (const [version, bundle] of retained) {
      if (
        version !== this.snapshot.activeVersion &&
        !referencedVersions.has(version) &&
        now.getTime() - bundle.publishedAt.getTime() > threshold
      ) {
        retained.delete(version)
        removed.push(version)
      }
    }
    if (removed.length)
      this.snapshot = Object.freeze({
        ...this.snapshot,
        retained: immutableMap(retained.entries()),
      })
    return removed
  }
}
