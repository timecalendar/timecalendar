import { DataSource } from "typeorm"

const clearTable = async (dataSource: DataSource, tableName: string) =>
  dataSource.query(`
  SET FOREIGN_KEY_CHECKS = 0; 
  TRUNCATE table ${tableName}; 
  SET FOREIGN_KEY_CHECKS = 1;
`)

export const clearDatabase = async (dataSource: DataSource) => {
  if (!dataSource.isInitialized) return
  for (const entity of dataSource.entityMetadatas) {
    await clearTable(dataSource, entity.tableName)
  }
}
