import { useUserStore } from "@/store/userStore";
import { tokenStorage } from "@/utils/tokenStorage";

export const setAuthSession = async (token: string, username: string): Promise<void> => {
  await tokenStorage.setToken(token);
  useUserStore.getState().setUser(username);
};

export const clearAuthSession = async (): Promise<void> => {
  await tokenStorage.clearToken();
  useUserStore.getState().clearUser();
};
