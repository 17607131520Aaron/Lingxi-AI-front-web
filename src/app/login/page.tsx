"use client";

import { Alert, Button, Card, Form, Input, Layout, message, Tabs, Typography } from "antd";
import { useMemo, useState } from "react";
import { login, register } from "@/api/auth";
import { setAuthSession } from "@/utils/authSession";
import { publishNavigate } from "@/utils/navigationBus";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const commonRules = useMemo(
    () => [
      { required: true, message: "请输入内容" },
      { min: 3, message: "至少 3 位字符" },
      { max: 32, message: "最多 32 位字符" },
    ],
    [],
  );

  const onSubmit = async (path: "login" | "register", values: { username: string; password: string }) => {
    setLoading(true);
    setServerError("");
    try {
      const body = path === "login" ? await login(values) : await register(values);
      await setAuthSession(body.token, body.username);
      message.success(path === "login" ? "登录成功" : "注册成功");
      publishNavigate({ to: "/", replace: true });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#0b1220", padding: 16 }}>
      <div style={{ maxWidth: 420, width: "100%", margin: "auto" }}>
        <Card style={{ background: "rgba(255,255,255,.06)", borderColor: "rgba(255,255,255,.1)" }}>
          <Typography.Title level={3} style={{ color: "#e6f0ff", marginTop: 0 }}>
            灵犀智能 AI
          </Typography.Title>
          <Typography.Paragraph style={{ color: "rgba(230,240,255,.72)" }}>请先登录后再进入模块</Typography.Paragraph>
          {serverError ? <Alert type="error" style={{ marginBottom: 12 }} title={serverError} showIcon /> : null}
          <Tabs
            items={[
              {
                key: "login",
                label: "登录",
                children: (
                  <Form layout="vertical" onFinish={(values) => onSubmit("login", values)}>
                    <Form.Item label="用户名" name="username" rules={commonRules}>
                      <Input autoComplete="username" />
                    </Form.Item>
                    <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }]}>
                      <Input.Password autoComplete="current-password" />
                    </Form.Item>
                    <Button block htmlType="submit" loading={loading} type="primary">
                      登录
                    </Button>
                  </Form>
                ),
              },
              {
                key: "register",
                label: "注册",
                children: (
                  <Form layout="vertical" onFinish={(values) => onSubmit("register", values)}>
                    <Form.Item label="用户名" name="username" rules={commonRules}>
                      <Input autoComplete="username" />
                    </Form.Item>
                    <Form.Item
                      label="密码"
                      name="password"
                      rules={[
                        { required: true, message: "请输入密码" },
                        { min: 6, message: "至少 6 位字符" },
                        { max: 64, message: "最多 64 位字符" },
                      ]}
                    >
                      <Input.Password autoComplete="new-password" />
                    </Form.Item>
                    <Button block htmlType="submit" loading={loading} type="primary">
                      注册并登录
                    </Button>
                  </Form>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </Layout>
  );
}
