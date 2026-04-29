import { ProfileRepository } from "../repositories/ProfileRepository";

export class ProfileService {
  constructor(private repo: ProfileRepository) {}

  async getMe(userId: string) {
    const profile = await this.repo.getProfile(userId);
    if (!profile) throw new Error("User profile not found.");
    return profile;
  }

  async setupProfile(userId: string, data: any) {
    const { universityId, collegeId, majorId, yearLevelId, preferredLanguage } = data;
    if (!universityId || !collegeId || !majorId || !yearLevelId) {
      throw new Error("University, college, major, and year level are required.");
    }
    const lang = preferredLanguage === "ar" || preferredLanguage === "en" ? preferredLanguage : "en";

    await this.repo.updateProfile(userId, {
      university_id: universityId,
      college_id: collegeId,
      major_id: majorId,
      year_level_id: yearLevelId,
      preferred_language: lang,
      updated_at: new Date().toISOString(),
    });
  }

  async updateAISettings(userId: string, data: any) {
    const { aiApiKey, aiModel, aiProvider } = data;
    await this.repo.updateProfile(userId, {
      ai_api_key: aiApiKey || null,
      ai_model: aiModel || null,
      ai_provider: aiProvider || 'openai',
      updated_at: new Date().toISOString(),
    });
  }

  async requestVerification(userId: string) {
    const profile = await this.repo.getVerificationStatus(userId);
    if (!profile) throw new Error("User profile not found.");
    if (profile.is_verified) throw new Error("Profile is already verified.");
    if (profile.verification_requested_at) throw new Error("Verification has already been requested.");

    const updated = await this.repo.requestVerification(userId, new Date().toISOString());
    if (!updated) throw new Error("Verification request could not be applied. Please retry.");
    return updated;
  }
}
