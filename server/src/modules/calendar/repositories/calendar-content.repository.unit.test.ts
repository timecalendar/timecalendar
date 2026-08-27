import { CalendarContentRepository } from "./calendar-content.repository"

describe("CalendarContentRepository.saveWithTransaction", () => {
  it("loads prior content exactly once under the pessimistic lock", async () => {
    const previousContent = { id: "content-id", events: [] }
    const queryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(async () => previousContent),
    }
    const transactionalRepository = {
      createQueryBuilder: jest.fn(() => queryBuilder),
      save: jest.fn(async (content) => content),
    }
    const manager = {
      getRepository: jest.fn(() => transactionalRepository),
    }
    const repository = {
      manager: {
        transaction: jest.fn(async (work) => work(manager)),
      },
    }
    const inSameTransaction = jest.fn(async () => undefined)

    await new CalendarContentRepository(
      repository as never,
    ).saveWithTransaction("calendar-id", { events: [] }, inSameTransaction)

    expect(queryBuilder.setLock).toHaveBeenCalledTimes(1)
    expect(queryBuilder.setLock).toHaveBeenCalledWith("pessimistic_write")
    expect(queryBuilder.getOne).toHaveBeenCalledTimes(1)
    expect(inSameTransaction).toHaveBeenCalledWith(manager, previousContent)
    expect(transactionalRepository.save).toHaveBeenCalledTimes(1)
  })
})
