"use client";
import type React from "react";

import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import { Dropdown, Layout, Menu } from "antd";
import classNames from "classnames/bind";
import styles from "../styles/side-menu-content.module.scss";

import type { MenuProps } from "antd";

const { Sider } = Layout;
const cx = classNames.bind(styles);

interface ISideMenuContentProps {
  collapsed: boolean;
  handleCollapse: (value: boolean) => void;
  toggleCollapsed: () => void;
  userInfo: {
    name: string;
    role?: string;
  };
}

const SideMenuContent: React.FC<ISideMenuContentProps> = (props) => {
  const { collapsed, handleCollapse, toggleCollapsed, userInfo } = props;

  const userActionItems: NonNullable<MenuProps["items"]> = [
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "设置",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出",
    },
  ];

  const handleUserActionClick: NonNullable<MenuProps["onClick"]> = ({ key }) => {
    if (key === "logout") {
      // void onLogout?.();
      return;
    }

    if (key === "settings") {
      // void onSettings?.();
    }
  };

  return (
    <Sider
      collapsible
      breakpoint="md"
      className={cx("side-menu-content")}
      collapsed={collapsed}
      collapsedWidth={72}
      trigger={null}
      width={248}
      onBreakpoint={handleCollapse}
    >
      <div className={cx("appLayoutSideMenu")}>
        <div className={cx("sideMenuContent")}></div>
        <div className={cx("sideMenuFooter")}>
          <div className={cx("userCard")} role="button" tabIndex={0}>
            <div aria-hidden className={cx("userAvatar")}>
              <UserOutlined />
            </div>
            <div className={cx("userMeta")}>
              <div className={cx("userName")}>{userInfo.name}</div>
              <div className={cx("userRole")}>{userInfo.role ?? ""}</div>
            </div>
            <div aria-hidden className={cx("userActions")}>
              <Dropdown
                menu={{
                  items: userActionItems,
                  onClick: handleUserActionClick,
                }}
                placement="topRight"
                trigger={["click"]}
              >
                <button aria-label="用户操作" className={cx("userActionTrigger")} type="button">
                  <SettingOutlined />
                </button>
              </Dropdown>
            </div>
          </div>

          <button className={cx("collapseBtn")} type="button" onClick={toggleCollapsed}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            <span className={cx("collapseBtnText")}>{collapsed ? "展开" : "收起"}</span>
          </button>
        </div>
      </div>
    </Sider>
  );
};

export default SideMenuContent;
