export interface IAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  roleId: string;
  permissions?: string[];
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  roleId: string;
  phoneNumber?: string;
  preferredLanguage?: string;
}

export interface IRefreshTokenRequest {
  refreshToken: string;
}

export interface IAuthResponse {
  user: IAuthUser;
  tokens: IAuthTokens;
}