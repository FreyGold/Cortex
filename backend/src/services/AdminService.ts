import { AdminRepository } from "../repositories/AdminRepository";

export class AdminService {
  constructor(private repo: AdminRepository) {}

  async getUsers(query: string, limit: number) {
    return this.repo.getUsers(query, limit);
  }

  async verifyUser(userId: string, isVerified: boolean, verifiedBy: string) {
    const result = await this.repo.verifyUser(userId, isVerified, verifiedBy);
    if (!result) throw new Error("User profile not found.");
    return result;
  }

  async createUniversity(data: any) {
    const { name_en, slug } = data;
    if (!name_en || !slug) throw new Error("name_en and slug are required.");
    return this.repo.createUniversity({
      ...data,
      name_en: name_en.trim(),
      slug: slug.trim(),
    });
  }

  async createCollege(data: any) {
    const { university_id, name_en, slug } = data;
    if (!university_id || !name_en || !slug) throw new Error("university_id, name_en and slug are required.");
    return this.repo.createCollege({
      ...data,
      name_en: name_en.trim(),
      slug: slug.trim(),
    });
  }

  async createMajor(data: any) {
    const { college_id, name_en, slug } = data;
    if (!college_id || !name_en || !slug) throw new Error("college_id, name_en and slug are required.");
    return this.repo.createMajor({
      ...data,
      name_en: name_en.trim(),
      slug: slug.trim(),
      sort_order: typeof data.sort_order === "number" ? Math.trunc(data.sort_order) : 0,
    });
  }

  async createCourse(data: any) {
    const { major_id, name_en } = data;
    if (!major_id || !name_en) throw new Error("major_id and name_en are required.");
    return this.repo.createCourse({
      ...data,
      name_en: name_en.trim(),
      credits: typeof data.credits === "number" ? Math.trunc(data.credits) : null,
    });
  }

  async seedData() {
    const yearPayload = [
      { level: 1, name_en: "First Year", name_ar: "السنة الأولى" },
      { level: 2, name_en: "Second Year", name_ar: "السنة الثانية" },
      { level: 3, name_en: "Third Year", name_ar: "السنة الثالثة" },
      { level: 4, name_en: "Fourth Year", name_ar: "السنة الرابعة" },
      { level: 5, name_en: "Fifth Year", name_ar: "السنة الخامسة" },
    ];
    await this.repo.seedYearLevels(yearPayload);
    return yearPayload.length;
  }
}
