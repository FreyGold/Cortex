import { DataRepository } from "../repositories/DataRepository";

export class DataService {
  constructor(private repo: DataRepository) {}

  async getCatalog() {
    const [universities, colleges, majors, yearLevels, courses] = await Promise.all([
      this.repo.getUniversities(),
      this.repo.getColleges(),
      this.repo.getMajors(),
      this.repo.getYearLevels(),
      this.repo.getCourses(),
    ]);
    return { universities, colleges, majors, yearLevels, courses };
  }

  async getCourseDetail(courseId: string) {
    const [course, resources, doctors, doctorAssignments] = await Promise.all([
      this.repo.getCourse(courseId),
      this.repo.getResources(courseId),
      this.repo.getDoctors(),
      this.repo.getCourseDoctors(courseId),
    ]);
    return { course, resources, doctors, doctorAssignments };
  }

  async createDoctor(name_en: string) {
    if (!name_en) throw new Error("Doctor name is required.");
    return this.repo.createDoctor(name_en.trim());
  }

  async createCourse(data: any) {
    const { major_id, year_level_id, name_en, name_ar, code, description, credits } = data;
    if (!major_id || !name_en) throw new Error("major_id and name_en are required.");
    return this.repo.createCourse({
      major_id,
      year_level_id: year_level_id ?? null,
      name_en: name_en.trim(),
      name_ar: name_ar?.trim() || null,
      code: code?.trim() || null,
      description: description?.trim() || null,
      credits: typeof credits === "number" ? Math.trunc(credits) : null,
    });
  }

  async updateCourse(courseId: string, updates: any) {
    return this.repo.updateCourse(courseId, updates);
  }

  async createResource(courseId: string, userId: string, data: any) {
    const { academic_year_id, doctor_id, title_en, type, google_drive_id } = data;
    if (!title_en || !type || !google_drive_id) throw new Error("title_en, type, and google_drive_id are required.");
    
    return this.repo.createResource({
      ...data,
      course_id: courseId,
      uploaded_by: userId,
      title_en: title_en.trim(),
      title_ar: data.title_ar?.trim() || null,
      description: data.description?.trim() || null,
    });
  }

  async updateResource(resourceId: string, updates: any) {
    return this.repo.updateResource(resourceId, updates);
  }

  async deleteResource(resourceId: string) {
    await this.repo.deleteResource(resourceId);
  }
}
