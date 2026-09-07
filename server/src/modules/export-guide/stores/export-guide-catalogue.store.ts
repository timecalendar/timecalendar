import { randomUUID } from "crypto"
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "fs"
import { join } from "path"
import { Inject, Injectable } from "@nestjs/common"
import {
  ExportGuideBundle,
  ExportGuideSnapshot,
} from "modules/export-guide/models/export-guide.model"
import { ExportGuideValidationError } from "modules/export-guide/validation/export-guide-validation.error"
import { ExportGuideCatalogueValidator } from "modules/export-guide/validation/export-guide-catalogue.validator"

export const EXPORT_GUIDE_CATALOGUE_DIRECTORY =
  "EXPORT_GUIDE_CATALOGUE_DIRECTORY"

type StoredExportGuideBundle = Omit<ExportGuideBundle, "publishedAt"> & {
  publishedAt: string
}

const immutableMap = <K, V>(map: Map<K, V>): ReadonlyMap<K, V> => {
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
  private readonly staged = new Map<
    string,
    { bundle: ExportGuideBundle; path: string }
  >()
  private readonly versionsDirectory: string
  private readonly pointerPath: string

  constructor(
    @Inject(EXPORT_GUIDE_CATALOGUE_DIRECTORY)
    private readonly directory: string,
    private readonly validator: ExportGuideCatalogueValidator,
  ) {
    this.versionsDirectory = join(directory, "versions")
    this.pointerPath = join(directory, "active.json")
    this.snapshot = this.loadSnapshot()
  }

  private versionPath(version: string): string {
    return join(
      this.versionsDirectory,
      `${Buffer.from(version).toString("base64url")}.json`,
    )
  }

  private serialize(bundle: ExportGuideBundle): string {
    return JSON.stringify({
      ...bundle,
      publishedAt: bundle.publishedAt.toISOString(),
    } satisfies StoredExportGuideBundle)
  }

  private deserialize(contents: string): ExportGuideBundle {
    const stored = JSON.parse(contents) as StoredExportGuideBundle
    const publishedAt = new Date(stored.publishedAt)
    if (
      !stored.catalogueVersion ||
      !stored.catalogues ||
      Number.isNaN(publishedAt.getTime())
    )
      throw new ExportGuideValidationError("stored_bundle_invalid")
    const catalogues = this.validator.validatePair(
      stored.catalogues.fr,
      stored.catalogues.en,
    )
    if (catalogues.fr.catalogueVersion !== stored.catalogueVersion)
      throw new ExportGuideValidationError("stored_bundle_invalid")
    return Object.freeze({ ...stored, catalogues, publishedAt })
  }

  private loadSnapshot(): ExportGuideSnapshot {
    if (!existsSync(this.pointerPath))
      return Object.freeze({ retained: immutableMap(new Map()) })
    const { activeVersion, retainedVersions } = JSON.parse(
      readFileSync(this.pointerPath, "utf8"),
    ) as { activeVersion?: unknown; retainedVersions?: unknown }
    if (
      typeof activeVersion !== "string" ||
      !Array.isArray(retainedVersions) ||
      retainedVersions.some((version) => typeof version !== "string") ||
      !retainedVersions.includes(activeVersion)
    )
      throw new ExportGuideValidationError("active_pointer_invalid")
    const retained = new Map<string, ExportGuideBundle>()
    for (const version of retainedVersions as string[]) {
      if (retained.has(version))
        throw new ExportGuideValidationError("active_pointer_invalid")
      const bundle = this.deserialize(
        readFileSync(this.versionPath(version), "utf8"),
      )
      if (bundle.catalogueVersion !== version)
        throw new ExportGuideValidationError("stored_bundle_invalid")
      retained.set(version, bundle)
    }
    return Object.freeze({
      activeVersion,
      active: retained.get(activeVersion),
      retained: immutableMap(retained),
    })
  }

  private replacePointer(
    activeVersion: string,
    retainedVersions: readonly string[],
  ): void {
    mkdirSync(this.directory, { recursive: true })
    const pointerStagingPath = join(
      this.directory,
      `.active.${randomUUID()}.tmp`,
    )
    try {
      writeFileSync(
        pointerStagingPath,
        JSON.stringify({ activeVersion, retainedVersions }),
        { flag: "wx" },
      )
      renameSync(pointerStagingPath, this.pointerPath)
    } catch (error) {
      rmSync(pointerStagingPath, { force: true })
      throw error
    }
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
      this.staged.has(bundle.catalogueVersion) ||
      existsSync(this.versionPath(bundle.catalogueVersion))
    )
      throw new ExportGuideValidationError("version_exists")
    mkdirSync(this.versionsDirectory, { recursive: true })
    const stagedPath = join(
      this.versionsDirectory,
      `.${Buffer.from(bundle.catalogueVersion).toString(
        "base64url",
      )}.${randomUUID()}.tmp`,
    )
    writeFileSync(stagedPath, this.serialize(bundle), { flag: "wx" })
    this.staged.set(bundle.catalogueVersion, { bundle, path: stagedPath })
  }

  commitStaged(version: string): void {
    const staged = this.staged.get(version)
    if (!staged) throw new ExportGuideValidationError("version_missing")
    const versionPath = this.versionPath(version)
    if (existsSync(versionPath))
      throw new ExportGuideValidationError("version_exists")

    renameSync(staged.path, versionPath)
    const retained = new Map(this.snapshot.retained).set(version, staged.bundle)
    try {
      this.replacePointer(version, [...retained.keys()])
    } catch (error) {
      renameSync(versionPath, staged.path)
      throw error
    }
    this.snapshot = Object.freeze({
      activeVersion: version,
      active: staged.bundle,
      retained: immutableMap(retained),
    })
    this.staged.delete(version)
  }

  discardStaged(version: string): void {
    const staged = this.staged.get(version)
    if (staged) rmSync(staged.path, { force: true })
    this.staged.delete(version)
  }

  activate(version: string): void {
    const retained = this.snapshot.retained.get(version)
    if (!retained) throw new ExportGuideValidationError("version_missing")
    this.replacePointer(version, [...this.snapshot.retained.keys()])
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
    if (removed.length) {
      this.replacePointer(this.snapshot.activeVersion!, [...retained.keys()])
      for (const version of removed)
        rmSync(this.versionPath(version), { force: true })
      this.snapshot = Object.freeze({
        ...this.snapshot,
        retained: immutableMap(retained),
      })
    }
    return removed
  }
}
