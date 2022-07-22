import { DataSource } from "typeorm"

export const assertChanges = async <T>(
  dataSource: DataSource,
  models: [any, number][],
  fn: () => Promise<T>,
) => {
  const initialCount = await Promise.all(
    models.map(([model]) => dataSource.getRepository(model).count()),
  )

  const rep = await fn()

  const finalCount = await Promise.all(
    models.map(([model]) => dataSource.getRepository(model).count()),
  )

  models.forEach(([, expected], i) => {
    const difference = finalCount[i] - initialCount[i]
    expect(difference).toBe(expected)
  })

  return rep
}
