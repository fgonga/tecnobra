import { EventPayloadBuilder } from "../EventPayloadBuilder"
import { CourseModel } from "../../models/course.model"

export class CourseUpdateBuilder implements EventPayloadBuilder {

  supports(type: string): boolean {
    return type === "course_update"
  }

  async build(eventData: any) {
    if (!eventData?.data?.courseId) {
      throw new Error("courseId required")
    }

    const course = await CourseModel.findOneBy("id", eventData.data.courseId)
    if (!course) throw new Error(`Course not found: ${eventData.data.courseId}`)

    return {
      id: course.id,
      name: course.name,
      slug: course.slug,
      price: course.price,
      active: (course as any).active ?? true,
    }
  }
}
