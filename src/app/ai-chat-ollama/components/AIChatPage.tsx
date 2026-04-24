"use client";
import { FC, useRef, useEffect, ReactNode } from "react";
import { SendOutlined, RobotOutlined, UserOutlined } from "@ant-design/icons";
import { Card, Space, Input, Typography, Button, Flex, Empty, Spin, Avatar, Switch } from "antd";
import classNames from "classnames/bind";
import styles from "../styles/ai-chat-page.module.scss";
const cx = classNames.bind(styles);

const { Text } = Typography;
const { TextArea } = Input;

interface ChatMessageView {
  id: string;
  role: "user" | "assistant";
  content: string;
  enableWebSearch?: boolean;
}

interface AIChatPageProps {
  inputValue: string;
  isReplying: boolean;
  isSessionLoading: boolean;
  messages: ChatMessageView[];
  enableWebSearch: boolean;
  setEnableWebSearch: (value: boolean) => void;
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSend: () => Promise<void>;
}

const AIChatPage: FC<AIChatPageProps> = ({
  inputValue,
  isReplying,
  isSessionLoading,
  messages,
  enableWebSearch,
  setEnableWebSearch,
  handleInputChange,
  handleSend,
}) => {
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    const messageListElement = messageListRef.current;
    if (!messageListElement || !shouldAutoScrollRef.current) {
      return;
    }

    messageListElement.scrollTo({
      top: messageListElement.scrollHeight,
      behavior: "auto",
    });
  }, [messages, isReplying]);

  const handleMessageListScroll = (): void => {
    const messageListElement = messageListRef.current;
    if (!messageListElement) {
      return;
    }

    const distanceToBottom =
      messageListElement.scrollHeight - messageListElement.scrollTop - messageListElement.clientHeight;
    shouldAutoScrollRef.current = distanceToBottom <= 40;
  };

  const renderMessages = (): ReactNode => {
    if (messages.length === 0) {
      if (isSessionLoading) {
        return (
          <Flex justify="center" align="center" style={{ minHeight: 120 }}>
            <Spin size="small" />
          </Flex>
        );
      }
      return <Empty description="暂无消息，先发起一次提问吧" />;
    }

    return (
      <Flex vertical gap={12}>
        {messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <Flex key={message.id} align="start" gap={10} justify={isUser ? "end" : "start"}>
              {!isUser && <Avatar icon={<RobotOutlined />} style={{ flexShrink: 0 }} />}
              <Card
                size="small"
                style={{
                  background: isUser ? "#e6f4ff" : "#fafafa",
                  maxWidth: "80%",
                }}
              >
                <Flex align="center" justify="space-between" gap={8} style={{ marginBottom: 6 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {isUser ? "我" : "AI"}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {message.enableWebSearch ? "已联网搜索" : "未联网搜索"}
                  </Text>
                </Flex>
                <Text style={{ whiteSpace: "pre-wrap" }}>{message.content}</Text>
              </Card>
              {isUser && <Avatar icon={<UserOutlined />} style={{ flexShrink: 0 }} />}
            </Flex>
          );
        })}
        {isReplying && (
          <Flex align="center" gap={8}>
            <Avatar icon={<RobotOutlined />} />
            <Spin size="small" />
            <Text type="secondary">AI 正在思考...</Text>
          </Flex>
        )}
      </Flex>
    );
  };
  return (
    <div className={cx("ai-chat-page")}>
      {/*<div className={cx("ai-chat-page-header")}>标题部分</div>*/}
      <div className={cx("ai-chat-page-content")}>
        <Card
          className={cx("ai-chat-card")}
          size="small"
          style={{ height: "100%" }}
          title={<Text strong>会话内容</Text>}
        >
          <div ref={messageListRef} className={cx("ai-chat-message-list")} onScroll={handleMessageListScroll}>
            {renderMessages()}
          </div>
        </Card>
      </div>
      <div className={cx("ai-chat-page-footer")}>
        <Card size="small" title={<Text strong>输入区</Text>}>
          <Space orientation="vertical" size={10} style={{ width: "100%" }}>
            <Flex justify="space-between" align="center">
              <Text type="secondary">联网搜索</Text>
              <Switch checked={enableWebSearch} onChange={setEnableWebSearch} disabled={isReplying} />
            </Flex>
            <TextArea
              autoSize={{ minRows: 3, maxRows: 6 }}
              placeholder="请输入你的问题，例如：如何在条码管理中批量生成二维码？"
              value={inputValue}
              onChange={handleInputChange}
            />
            <Flex justify="end">
              <Button icon={<SendOutlined />} loading={isReplying} type="primary" onClick={handleSend}>
                发送
              </Button>
            </Flex>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default AIChatPage;
