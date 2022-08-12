import { DataSource } from "typeorm"

const clearTables = async (dataSource: DataSource, tableNames: string[]) =>
  dataSource.query(`TRUNCATE TABLE ${tableNames.join(", ")};`)

export const clearDatabase = async (dataSource: DataSource) => {
  if (!dataSource.isInitialized) return
  await clearTables(
    dataSource,
    dataSource.entityMetadatas.map((entity) => entity.tableName),
  )
}
