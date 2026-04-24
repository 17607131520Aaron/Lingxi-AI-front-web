import { http } from "@/utils/request";
import { MOCK_MODULES, type ModuleEntry } from "@/mock/appMock";

export async function getModules(): Promise<ModuleEntry[]> {
  try {
    return await http.get<ModuleEntry[]>("/modules");
  } catch {
    return MOCK_MODULES;
  }
}
