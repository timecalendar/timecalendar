import { DataSource } from "typeorm"

const clearTables = async (dataSource: DataSource, tableNames: string[]) =>
  dataSource.query(`
SET FOREIGN_KEY_CHECKS = 0; 
${tableNames.map((tableName) => `TRUNCATE table ${tableName};`).join("\n")}
SET FOREIGN_KEY_CHECKS = 1;
`)

export const clearDatabase = async (dataSource: DataSource) => {
  if (!dataSource.isInitialized) return
  await clearTables(
    dataSource,
    dataSource.entityMetadatas.map((entity) => entity.tableName),
  )
}
