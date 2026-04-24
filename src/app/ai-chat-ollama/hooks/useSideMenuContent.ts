import { useCallback, useState } from "react";

export interface ISideMenuContentHookResult {
  collapsed: boolean;
  handleCollapse: (value: boolean) => void;
  toggleCollapsed: () => void;
}

const useSideMenuContent = (): ISideMenuContentHookResult => {
  const [collapsed, setCollapsed] = useState(false);

  const handleCollapse = useCallback((value: boolean) => {
    setCollapsed(value);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((v) => !v);
  }, []);

  return { collapsed, handleCollapse, toggleCollapsed };
};

export default useSideMenuContent;
