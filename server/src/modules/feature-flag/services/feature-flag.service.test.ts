import { Test, TestingModule } from "@nestjs/testing"
import { Client, getOpenFeatureClientToken } from "@openfeature/nestjs-sdk"
import { FeatureFlagService } from "./feature-flag.service"

describe("FeatureFlagService", () => {
  let service: FeatureFlagService
  let mockClient: jest.Mocked<Client>

  beforeEach(async () => {
    mockClient = {
      getBooleanValue: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagService,
        {
          provide: getOpenFeatureClientToken(),
          useValue: mockClient,
        },
      ],
    }).compile()

    service = module.get<FeatureFlagService>(FeatureFlagService)
  })

  describe("evaluateFlag", () => {
    it("should return the evaluated flag value when client succeeds", async () => {
      // Arrange
      const key = "test-flag"
      const defaultValue = false
      const context = { userId: "123" }
      const expectedResult = true
      mockClient.getBooleanValue.mockResolvedValue(expectedResult)

      // Act
      const result = await service.evaluateFlag(key, defaultValue, context)

      // Assert
      expect(result).toBe(expectedResult)
      expect(mockClient.getBooleanValue).toHaveBeenCalledWith(
        key,
        defaultValue,
        context,
      )
      expect(mockClient.getBooleanValue).toHaveBeenCalledTimes(1)
    })

    it("should return default value when client throws an error", async () => {
      // Arrange
      const key = "test-flag"
      const defaultValue = true
      const context = { userId: "123" }
      const error = new Error("OpenFeature error")
      mockClient.getBooleanValue.mockRejectedValue(error)

      // Act
      const result = await service.evaluateFlag(key, defaultValue, context)

      // Assert
      expect(result).toBe(defaultValue)
      expect(mockClient.getBooleanValue).toHaveBeenCalledWith(
        key,
        defaultValue,
        context,
      )
      expect(mockClient.getBooleanValue).toHaveBeenCalledTimes(1)
    })

    it("should use default parameters when not provided", async () => {
      // Arrange
      const key = "test-flag"
      const expectedResult = false
      mockClient.getBooleanValue.mockResolvedValue(expectedResult)

      // Act
      const result = await service.evaluateFlag(key)

      // Assert
      expect(result).toBe(expectedResult)
      expect(mockClient.getBooleanValue).toHaveBeenCalledWith(key, false, {})
      expect(mockClient.getBooleanValue).toHaveBeenCalledTimes(1)
    })

    it("should use provided default value when context is not provided", async () => {
      // Arrange
      const key = "test-flag"
      const defaultValue = true
      const expectedResult = true
      mockClient.getBooleanValue.mockResolvedValue(expectedResult)

      // Act
      const result = await service.evaluateFlag(key, defaultValue)

      // Assert
      expect(result).toBe(expectedResult)
      expect(mockClient.getBooleanValue).toHaveBeenCalledWith(
        key,
        defaultValue,
        {},
      )
      expect(mockClient.getBooleanValue).toHaveBeenCalledTimes(1)
    })
  })

  describe("evaluateFlags", () => {
    it("should return evaluated values for all flags when client succeeds", async () => {
      // Arrange
      const keys = ["flag1", "flag2", "flag3"]
      const context = { userId: "123", role: "admin" }
      mockClient.getBooleanValue
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)

      // Act
      const result = await service.evaluateFlags(keys, context)

      // Assert
      expect(result).toEqual({
        flag1: true,
        flag2: false,
        flag3: true,
      })
      expect(mockClient.getBooleanValue).toHaveBeenCalledTimes(3)
      expect(mockClient.getBooleanValue).toHaveBeenNthCalledWith(
        1,
        "flag1",
        false,
        context,
      )
      expect(mockClient.getBooleanValue).toHaveBeenNthCalledWith(
        2,
        "flag2",
        false,
        context,
      )
      expect(mockClient.getBooleanValue).toHaveBeenNthCalledWith(
        3,
        "flag3",
        false,
        context,
      )
    })

    it("should return default values for flags that fail evaluation", async () => {
      // Arrange
      const keys = ["flag1", "flag2", "flag3"]
      const context = { userId: "123" }
      mockClient.getBooleanValue
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(false)

      // Act
      const result = await service.evaluateFlags(keys, context)

      // Assert
      expect(result).toEqual({
        flag1: true,
        flag2: false, // default value used due to error
        flag3: false,
      })
      expect(mockClient.getBooleanValue).toHaveBeenCalledTimes(3)
    })

    it("should return empty object when no keys are provided", async () => {
      // Arrange
      const keys: string[] = []
      const context = { userId: "123" }

      // Act
      const result = await service.evaluateFlags(keys, context)

      // Assert
      expect(result).toEqual({})
      expect(mockClient.getBooleanValue).not.toHaveBeenCalled()
    })

    it("should use empty context when not provided", async () => {
      // Arrange
      const keys = ["flag1", "flag2"]
      mockClient.getBooleanValue
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)

      // Act
      const result = await service.evaluateFlags(keys)

      // Assert
      expect(result).toEqual({
        flag1: true,
        flag2: false,
      })
      expect(mockClient.getBooleanValue).toHaveBeenCalledTimes(2)
      expect(mockClient.getBooleanValue).toHaveBeenNthCalledWith(
        1,
        "flag1",
        false,
        {},
      )
      expect(mockClient.getBooleanValue).toHaveBeenNthCalledWith(
        2,
        "flag2",
        false,
        {},
      )
    })

    it("should handle single flag evaluation", async () => {
      // Arrange
      const keys = ["single-flag"]
      const context = { environment: "production" }
      mockClient.getBooleanValue.mockResolvedValueOnce(true)

      // Act
      const result = await service.evaluateFlags(keys, context)

      // Assert
      expect(result).toEqual({
        "single-flag": true,
      })
      expect(mockClient.getBooleanValue).toHaveBeenCalledTimes(1)
      expect(mockClient.getBooleanValue).toHaveBeenCalledWith(
        "single-flag",
        false,
        context,
      )
    })
  })
})
