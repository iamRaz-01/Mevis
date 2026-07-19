export interface AuthUser {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly roles: readonly string[];
}
