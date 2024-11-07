import { DataSource } from "typeorm"

const clearTables = async (dataSource: DataSource, tableNames: string[]) => {
  await dataSource.query(`TRUNCATE TABLE ${tableNames.join(", ")};`)
}

export const clearDatabase = async (dataSource: DataSource) => {
  await clearTables(
    dataSource,
    dataSource.entityMetadatas.map((entity) => entity.tableName),
  )
}
