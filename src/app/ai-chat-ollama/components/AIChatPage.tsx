"use client";
import { FC, useRef, useEffect } from "react";
import { SendOutlined, RobotOutlined, UserOutlined } from "@ant-design/icons";
import { Card, Space, Input, Typography, Button, Flex, Empty, Spin, Avatar } from "antd";
import classNames from "classnames/bind";
import useAIChat from "../hooks/useAIChat";
import styles from "../styles/ai-chat-page.module.scss";
const cx = classNames.bind(styles);

const { Text } = Typography;
const { TextArea } = Input;

const AIChatPage: FC = () => {
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const { inputValue, handleInputChange, isReplying, handleSend, messages } = useAIChat();

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
            {/*{renderMessages()}*/}
          </div>
        </Card>
      </div>
      <div className={cx("ai-chat-page-footer")}>
        <Card size="small" title={<Text strong>输入区</Text>}>
          <Space orientation="vertical" size={10} style={{ width: "100%" }}>
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
