"use client";
import type React from "react";

import {
  LogoutOutlined,
  MessageOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  SettingOutlined,
  DeleteOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Dropdown, Layout, Button, Popconfirm } from "antd";
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
  sessions: Array<{
    sessionId: string;
    title: string;
    updatedAt: number;
  }>;
  currentSessionId: string;
  onCreateSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

const SideMenuContent: React.FC<ISideMenuContentProps> = (props) => {
  const {
    collapsed,
    handleCollapse,
    toggleCollapsed,
    userInfo,
    sessions,
    currentSessionId,
    onCreateSession,
    onSelectSession,
    onDeleteSession,
  } = props;

  const formatUpdatedAt = (updatedAt: number): string => {
    if (!updatedAt) {
      return "";
    }
    const date = new Date(updatedAt);
    const pad = (value: number) => String(value).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    const second = pad(date.getSeconds());
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  };

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
        <div className={cx("sideMenuContent")}>
          <Button style={{ width: "100%" }} type="primary" icon={<PlusOutlined />} onClick={onCreateSession}>
            新建会话
          </Button>
          <div className={cx("sessionList")}>
            {sessions.map((item) => {
              const active = currentSessionId === item.sessionId;
              return (
                <div
                  key={item.sessionId}
                  className={cx("sessionRow", { sessionRowActive: active })}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectSession(item.sessionId)}
                >
                  <MessageOutlined className={cx("sessionIcon")} />
                  <div className={cx("sessionMeta")}>
                    <span className={cx("sessionTitle")}>{item.title?.trim() || "新会话"}</span>
                    <span className={cx("sessionTime")}>{formatUpdatedAt(item.updatedAt)}</span>
                  </div>
                  <Popconfirm
                    title="删除会话"
                    description="删除后不可恢复，确认删除吗？"
                    okText="删除"
                    cancelText="取消"
                    onConfirm={(event) => {
                      event?.stopPropagation?.();
                      onDeleteSession(item.sessionId);
                    }}
                  >
                    <button
                      type="button"
                      className={cx("sessionDeleteBtn")}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      aria-label="删除会话"
                    >
                      <DeleteOutlined />
                    </button>
                  </Popconfirm>
                </div>
              );
            })}
          </div>
        </div>
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
