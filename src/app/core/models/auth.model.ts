export type LoginCredentials = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
  username: string;
};

export type LogoutResponse = {
  loggedOut: boolean;
};

export type AuthSession = {
  token: string;
  tokenType: string;
  expiresAt: string;
  username: string;
};
