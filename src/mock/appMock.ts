export type ModuleKind = "site" | "cms" | "tool";

export interface ModuleEntry {
  key: string;
  name: string;
  description: string;
  kind: ModuleKind;
  tags?: string[];
  href: string;
  openInNewTab?: boolean;
}

export const MOCK_MODULES: ModuleEntry[] = [
  {
    //使用本地的ollama调用大模型
    key: "ai-chat",
    name: "AI聊天",
    description: "使用本地的ollama调用大模型",
    kind: "tool",
    tags: ["AI", "聊天"],
    href: "ai-chat-ollama",
    openInNewTab: false,
  },
  {
    key: "portal",
    name: "门户站点",
    description: "面向用户的站点入口（示例：外部站点/独立域名）。",
    kind: "site",
    tags: ["站点", "外部"],
    href: "https://nextjs.org/docs/app/getting-started/installation",
    openInNewTab: true,
  },
];

export async function fetchModules(): Promise<ModuleEntry[]> {
  return MOCK_MODULES;
}
