"use client";

import { Badge, Card, Col, Divider, Empty, Layout, Row, Space, Tag, Typography } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ModuleEntry, ModuleKind } from "@/mock/appMock";
import { fetchModules } from "@/mock/appMock";

const KIND_LABEL: Record<ModuleKind, string> = {
  site: "站点",
  cms: "企业系统",
  tool: "工具",
};

export default function HomePage() {
  const [keyword, _setKeyword] = useState("");
  const [kind, _setKind] = useState<"all" | ModuleKind>("all");
  const [modules, setModules] = useState<ModuleEntry[]>([]);

  useEffect(() => {
    fetchModules()
      .then(setModules)
      .catch(() => {
        setModules([]);
      });
  }, []);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return modules.filter((m) => {
      if (kind !== "all" && m.kind !== kind) {
        return false;
      }
      if (!kw) {
        return true;
      }
      const hay = `${m.name} ${m.description} ${(m.tags ?? []).join(" ")}`.toLowerCase();
      return hay.includes(kw);
    });
  }, [keyword, kind, modules]);

  return (
    <Layout style={{ height: "100%", background: "#0b1220" }}>
      <Layout.Header
        style={{
          background: "transparent",
          padding: "16px 20px",
          height: "auto",
        }}
      ></Layout.Header>

      <Layout.Content style={{ padding: "0 20px 20px", overflow: "auto" }}>
        <Row gutter={[16, 16]}>
          {filtered.length === 0 ? (
            <Col span={24}>
              <Card style={{ background: "rgba(255,255,255,.06)" }}>
                <Empty description={<span style={{ color: "rgba(230,240,255,.72)" }}>没有匹配的模块</span>} />
              </Card>
            </Col>
          ) : null}

          {filtered.map((m) => (
            <Col key={m.key} lg={8} sm={12} xl={6} xs={24}>
              <Badge.Ribbon color={m.kind === "cms" ? "geekblue" : "cyan"} text={KIND_LABEL[m.kind]}>
                <Card
                  hoverable
                  style={{
                    background: "rgba(255,255,255,.06)",
                    borderColor: "rgba(255,255,255,.10)",
                  }}
                  styles={{
                    body: {
                      minHeight: 150,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    },
                  }}
                >
                  <Space orientation="vertical" size={6} style={{ flex: 1 }}>
                    <Typography.Title level={5} style={{ margin: 0, color: "#e6f0ff" }}>
                      {m.name}
                    </Typography.Title>
                    <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, color: "rgba(230,240,255,.72)" }}>
                      {m.description}
                    </Typography.Paragraph>
                    <Space wrap size={[6, 6]}>
                      {(m.tags ?? []).map((t) => (
                        <Tag
                          key={t}
                          style={{
                            background: "rgba(255,255,255,.08)",
                            borderColor: "rgba(255,255,255,.14)",
                            color: "rgba(230,240,255,.82)",
                          }}
                        >
                          {t}
                        </Tag>
                      ))}
                    </Space>
                  </Space>

                  <Divider
                    style={{
                      margin: "6px 0",
                      borderColor: "rgba(255,255,255,.10)",
                    }}
                  />

                  {m.openInNewTab ? (
                    <a href={m.href} rel="noreferrer" style={{ color: "#8ab4ff", fontWeight: 600 }} target="_blank">
                      打开模块 →
                    </a>
                  ) : (
                    <Link href={m.href} style={{ color: "#8ab4ff", fontWeight: 600 }}>
                      进入模块 →
                    </Link>
                  )}
                </Card>
              </Badge.Ribbon>
            </Col>
          ))}
        </Row>
      </Layout.Content>
    </Layout>
  );
}
