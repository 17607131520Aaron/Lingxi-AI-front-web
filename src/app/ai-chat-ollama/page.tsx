"use client";
import React from "react";
import { Layout, Spin } from "antd";
import classNames from "classnames/bind";
import SideMenuContent from "./components/SideMenuContent";
import AIChatPage from "./components/AIChatPage";
import styles from "./styles/pages.module.scss";
import useSideMenuContent from "./hooks/useSideMenuContent";

const cx = classNames.bind(styles);
const userInfo = { name: "admin", role: "管理" };
const AiChatPage: React.FC = () => {
  const { collapsed, handleCollapse, toggleCollapsed } = useSideMenuContent();
  return (
    <Layout className={cx("app-layout")}>
      <div className={cx("app-layout-side-menu")}>
        <SideMenuContent
          userInfo={userInfo}
          collapsed={collapsed}
          handleCollapse={handleCollapse}
          toggleCollapsed={toggleCollapsed}
        />
      </div>

      <Layout className={cx("app-layout-content")}>
        <div className={cx("app-layout-content-main")}>
          <AIChatPage />
        </div>
      </Layout>
    </Layout>
  );
};
export default AiChatPage;
