import { http } from "@/utils/request";

export interface AuthData {
  token: string;
  username: string;
}

export interface CurrentUser {
  username: string;
}

export const login = (payload: { username: string; password: string }) => {
  return http.post<AuthData>("/auth/login", payload);
};

export const register = (payload: { username: string; password: string }) => {
  return http.post<AuthData>("/auth/register", payload);
};

export const getCurrentUser = () => {
  return http.get<CurrentUser>("/auth/me");
};
