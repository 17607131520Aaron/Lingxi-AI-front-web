"use client";
import React from "react";
import { Layout } from "antd";
import classNames from "classnames/bind";
import SideMenuContent from "./components/SideMenuContent";
import AIChatPage from "./components/AIChatPage";
import styles from "./styles/pages.module.scss";
import useSideMenuContent from "./hooks/useSideMenuContent";
import useAIChat from "./hooks/useAIChat";

const cx = classNames.bind(styles);
const userInfo = { name: "admin", role: "管理" };
const AiChatPage: React.FC = () => {
  const { collapsed, handleCollapse, toggleCollapsed } = useSideMenuContent();
  const {
    inputValue,
    isReplying,
    messages,
    sessions,
    currentSessionId,
    isSessionLoading,
    enableWebSearch,
    setEnableWebSearch,
    selectSession,
    handleCreateSession,
    handleDeleteSession,
    handleInputChange,
    handleSend,
  } = useAIChat();
  return (
    <Layout className={cx("app-layout")}>
      <div className={cx("app-layout-side-menu")}>
        <SideMenuContent
          userInfo={userInfo}
          collapsed={collapsed}
          handleCollapse={handleCollapse}
          toggleCollapsed={toggleCollapsed}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onCreateSession={handleCreateSession}
          onSelectSession={selectSession}
          onDeleteSession={handleDeleteSession}
        />
      </div>

      <Layout className={cx("app-layout-content")}>
        <div className={cx("app-layout-content-main")}>
          <AIChatPage
            inputValue={inputValue}
            isReplying={isReplying}
            isSessionLoading={isSessionLoading}
            messages={messages}
            enableWebSearch={enableWebSearch}
            setEnableWebSearch={setEnableWebSearch}
            handleInputChange={handleInputChange}
            handleSend={handleSend}
          />
        </div>
      </Layout>
    </Layout>
  );
};
export default AiChatPage;
