import { Injectable } from "@nestjs/common"
import { UnivOrleansClient } from "./univ-orleans.client"

@Injectable()
export class UnivOrleansService {
  constructor(private readonly univOrleansClient: UnivOrleansClient) {}

  getStudentIcal(studentNumber: string) {
    return this.univOrleansClient.getStudentIcal(studentNumber)
  }
}
