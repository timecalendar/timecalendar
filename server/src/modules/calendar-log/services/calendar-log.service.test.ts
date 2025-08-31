import { createMock } from "@golevelup/ts-jest"
import { Test, TestingModule } from "@nestjs/testing"
import { CalendarLogMapper } from "modules/calendar-log/mappers/calendar-log.mapper"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { CalendarLogRepository } from "modules/calendar-log/repositories/calendar-log.repository"
import { CalendarLogService } from "modules/calendar-log/services/calendar-log.service"
import { Calendar } from "modules/calendar/models/calendar.entity"

describe("CalendarLogService", () => {
  let service: CalendarLogService
  let mockRepository: jest.Mocked<CalendarLogRepository>
  let mockMapper: jest.Mocked<CalendarLogMapper>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalendarLogService],
    })
      .useMocker(createMock)
      .compile()

    service = module.get<CalendarLogService>(CalendarLogService)
    mockRepository = module.get(CalendarLogRepository)
    mockMapper = module.get(CalendarLogMapper)
  })

  describe("getCalendarLogs", () => {
    it("should handle multiple calendar logs", async () => {
      // Arrange
      const tokens = ["token1", "token2"]
      const mockCalendar1: Calendar = {
        id: "calendar-1",
        token: "token1",
        name: "Calendar 1",
        schoolName: "School 1",
        url: "https://test1.com",
        customData: null,
        lastUpdatedAt: new Date(),
        lastAccessedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Calendar

      const mockCalendar2: Calendar = {
        id: "calendar-2",
        token: "token2",
        name: "Calendar 2",
        schoolName: "School 2",
        url: "https://test2.com",
        customData: null,
        lastUpdatedAt: new Date(),
        lastAccessedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Calendar

      const mockCalendarLogs: CalendarLog[] = [
        {
          id: "log-1",
          calendar: mockCalendar1,
          calendarChange: { oldItems: [], newItems: [], changedItems: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as CalendarLog,
        {
          id: "log-2",
          calendar: mockCalendar2,
          calendarChange: { oldItems: [], newItems: [], changedItems: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as CalendarLog,
      ]

      const mockMappedLogs = [
        {
          id: "log-1",
          calendarId: "calendar-1",
          calendarToken: "token1",
          calendarName: "Calendar 1",
          calendarChange: { oldItems: [], newItems: [], changedItems: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "log-2",
          calendarId: "calendar-2",
          calendarToken: "token2",
          calendarName: "Calendar 2",
          calendarChange: { oldItems: [], newItems: [], changedItems: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockRepository.findByCalendarTokens.mockResolvedValue(mockCalendarLogs)
      mockMapper.toCalendarLogGet
        .mockReturnValueOnce(mockMappedLogs[0])
        .mockReturnValueOnce(mockMappedLogs[1])

      // Act
      const result = await service.getCalendarLogs({ tokens })

      // Assert
      expect(result).toEqual(mockMappedLogs)
      expect(mockRepository.findByCalendarTokens).toHaveBeenCalledWith(tokens)
      expect(mockRepository.findByCalendarTokens).toHaveBeenCalledTimes(1)
      expect(mockMapper.toCalendarLogGet).toHaveBeenCalledTimes(2)
      expect(mockMapper.toCalendarLogGet).toHaveBeenNthCalledWith(
        1,
        mockCalendarLogs[0],
      )
      expect(mockMapper.toCalendarLogGet).toHaveBeenNthCalledWith(
        2,
        mockCalendarLogs[1],
      )
    })
  })
})
