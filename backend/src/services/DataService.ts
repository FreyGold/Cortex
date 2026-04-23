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

  async assignDoctorToCourse(courseId: string, doctorId: string) {
    if (!courseId || !doctorId) throw new Error("courseId and doctorId are required.");
    return this.repo.assignDoctorToCourse(courseId, doctorId);
  }

  async unassignDoctorFromCourse(courseId: string, doctorId: string) {
    if (!courseId || !doctorId) throw new Error("courseId and doctorId are required.");
    return this.repo.unassignDoctorFromCourse(courseId, doctorId);
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
    const { academic_year_id, doctor_id, title_en, type, google_drive_id, note_id } = data;
    if (!title_en || !type) throw new Error("title_en and type are required.");
    
    if (type !== "note" && !google_drive_id) {
        throw new Error("google_drive_id is required for non-note resources.");
    }

    if (type === "note" && !note_id) {
        throw new Error("note_id is required for note resources.");
    }
    
    return this.repo.createResource({
      course_id: courseId,
      uploaded_by: userId,
      title_en: title_en.trim(),
      title_ar: data.title_ar?.trim() || null,
      description: data.description?.trim() || null,
      type,
      exam_type: data.exam_type ?? null,
      doctor_id: doctor_id ?? null,
      google_drive_id: type === "note" ? null : google_drive_id,
      google_drive_url: type === "note" ? null : (data.google_drive_url ?? null),
      note_id: type === "note" ? note_id : null,
      academic_year_id: academic_year_id ?? null,
    });
  }

  async updateResource(resourceId: string, updates: any) {
    const { title_en, type, google_drive_id, note_id } = updates;
    
    const payload = {
        ...updates,
        title_en: title_en ? title_en.trim() : undefined,
        google_drive_id: type === "note" ? null : (google_drive_id || undefined),
        google_drive_url: type === "note" ? null : (updates.google_drive_url || undefined),
        note_id: type === "note" ? note_id : (type ? null : undefined),
    };

    return this.repo.updateResource(resourceId, payload);
  }

  async deleteResource(resourceId: string) {
    await this.repo.deleteResource(resourceId);
  }
}
