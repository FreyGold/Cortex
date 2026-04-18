import { AuthRepository } from "../repositories/AuthRepository";

export class AuthService {
  constructor(private repo: AuthRepository) {}

  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await this.repo.signUp({
      email,
      password,
      options: {
        data: fullName ? { full_name: fullName } : undefined,
      },
    });

    if (error) throw error;
    return {
      user: data.user,
      session: data.session,
      message: data.session
        ? "Signed up successfully."
        : "Signup succeeded. Check your email to confirm your account.",
    };
  }

  async login(email: string, password: string) {
    const { data, error } = await this.repo.signIn({
      email,
      password,
    });

    if (error) throw error;
    return {
      user: data.user,
      session: data.session,
      message: "Signed in successfully.",
    };
  }
}
