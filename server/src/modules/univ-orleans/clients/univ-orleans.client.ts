import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common"
import axios, { AxiosResponse } from "axios"
import qs from "qs"

@Injectable()
export class UnivOrleansClient {
  PROJECT = "2021-2022"
  ICAL_URL =
    "http://www.univ-orleans.fr/EDTWeb/export?project={project}&resources={resource}&type=ical"

  async getStudentIcal(studentNumber: string) {
    const postData = {
      project: this.PROJECT,
      action: "displayWeeksPeople",
      person: studentNumber,
    }

    let rep: AxiosResponse<any>

    try {
      rep = await axios({
        method: "post",
        url: "http://www.univ-orleans.fr/EDTWeb/edt",
        data: qs.stringify(postData),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })
    } catch (err) {
      throw new ServiceUnavailableException("Orleans API unavailable")
    }

    // Find resource id
    const regex = /resources=([0-9,]+)(&|$)/gi
    const matches = regex.exec(rep.data)
    if (!matches) throw new NotFoundException("Student not found")
    const resources = matches[1]

    let url = this.ICAL_URL
    url = url.replace("{project}", this.PROJECT)
    url = url.replace("{resource}", resources)

    return url
  }
}
