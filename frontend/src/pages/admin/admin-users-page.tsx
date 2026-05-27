import {
  CrownOutlined,
  EditOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "../../components/layout/app-shell";
import { useThemeColors } from "../../hooks/use-theme-colors";
import { fetchAdminUsers, fetchMembershipPlans, updateUserMembership } from "../../lib/api";
import type { AdminUserItem, MembershipPlan } from "../../types";

const { Text } = Typography;

const levelConfig: Record<string, { color: string; label: string }> = {
  free: { color: "default", label: "免费版" },
  pro: { color: "blue", label: "专业版" },
  enterprise: { color: "purple", label: "企业版" },
};

export function AdminUsersPage() {
  const c = useThemeColors();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminUsers({ q: search || undefined, page, page_size: 20 });
      setUsers(res.items);
      setTotal(res.total);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    fetchMembershipPlans().then(setPlans).catch(() => {});
  }, []);

  const handleEdit = (user: AdminUserItem) => {
    setEditingUser(user);
    form.setFieldsValue({
      membership_level: user.membership_level,
      is_admin: user.is_admin,
      expires_in_days: undefined,
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setEditLoading(true);
    try {
      const values = await form.validateFields();
      await updateUserMembership(editingUser.id, {
        membership_level: values.membership_level,
        is_admin: values.is_admin,
        expires_in_days: values.expires_in_days,
      });
      message.success("修改成功");
      setEditOpen(false);
      void load();
    } catch {
      // form validation or api error handled by interceptor
    } finally {
      setEditLoading(false);
    }
  };

  const columns: ColumnsType<AdminUserItem> = [
    {
      title: "用户",
      dataIndex: "username",
      key: "username",
      render: (name: string, record) => (
        <Space>
          <Avatar size={28} icon={<UserOutlined />} style={{ background: "#1668dc", flexShrink: 0 }}>
            {name[0]?.toUpperCase()}
          </Avatar>
          <Space size={4}>
            <Text strong style={{ color: c.textPrimary }}>{name}</Text>
            {record.is_admin && (
              <Tag color="gold" style={{ fontSize: 10, lineHeight: "16px", padding: "0 4px" }}>
                管理员
              </Tag>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: "会员等级",
      dataIndex: "membership_level",
      key: "membership_level",
      render: (level: string) => {
        const cfg = levelConfig[level] ?? { color: "default", label: level };
        return (
          <Space>
            {level !== "free" && <CrownOutlined style={{ color: level === "enterprise" ? "#7c3aed" : "#1668dc" }} />}
            <Tag color={cfg.color}>{cfg.label}</Tag>
          </Space>
        );
      },
    },
    {
      title: "到期时间",
      dataIndex: "membership_expires_at",
      key: "membership_expires_at",
      render: (val: string | null) => {
        if (!val) return <Text style={{ color: c.textTertiary }}>永久</Text>;
        const d = new Date(val);
        const expired = d.getTime() < Date.now();
        return (
          <Text style={{ color: expired ? "#ef4444" : c.textSecondary }}>
            {d.toLocaleDateString("zh-CN")}
            {expired && <Tag color="red" style={{ marginLeft: 6, fontSize: 10 }}>已过期</Tag>}
          </Text>
        );
      },
    },
    {
      title: "注册时间",
      dataIndex: "created_at",
      key: "created_at",
      render: (val: string) => new Date(val).toLocaleDateString("zh-CN"),
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="ADMIN"
        title="用户管理"
        description="管理平台用户、会员等级和权限"
        action={
          <Space>
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索用户名"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              allowClear
              style={{ width: 200 }}
            />
            <Button icon={<ReloadOutlined />} onClick={() => void load()}>
              刷新
            </Button>
          </Space>
        }
      />

      <Card style={{ background: c.cardBg, borderColor: c.cardBorder }}>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: setPage,
            showTotal: (t) => `共 ${t} 个用户`,
          }}
          locale={{ emptyText: "暂无用户数据" }}
        />
      </Card>

      <Modal
        title="编辑会员信息"
        open={editOpen}
        onOk={handleSave}
        onCancel={() => setEditOpen(false)}
        confirmLoading={editLoading}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        {editingUser && (
          <div style={{ marginBottom: 20 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="用户">
                <Space>
                  <Avatar size={22} icon={<UserOutlined />} style={{ background: "#1668dc" }}>
                    {editingUser.username[0]?.toUpperCase()}
                  </Avatar>
                  <Text strong>{editingUser.username}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="ID">{editingUser.id}</Descriptions.Item>
            </Descriptions>
          </div>
        )}

        <Form form={form} layout="vertical">
          <Form.Item name="membership_level" label="会员等级" rules={[{ required: true, message: "请选择会员等级" }]}>
            <Select
              options={[
                { label: "免费版 — 基础功能", value: "free" },
                { label: "专业版 — ¥99/月", value: "pro" },
                { label: "企业版 — ¥299/月", value: "enterprise" },
              ]}
            />
          </Form.Item>

          <Form.Item name="is_admin" label="管理员权限" valuePropName="checked">
            <Select
              options={[
                { label: "普通用户", value: false },
                { label: "管理员", value: true },
              ]}
            />
          </Form.Item>

          <Form.Item name="expires_in_days" label="会员有效期（天）" extra="留空则不修改到期时间。免费版自动设为永久。">
            <InputNumber min={1} max={3650} placeholder="如：30 / 365" style={{ width: "100%" }} />
          </Form.Item>
        </Form>

        {plans.length > 0 && (
          <div style={{ marginTop: 16, padding: 12, background: c.cardBg3 || "#141414", borderRadius: 8 }}>
            <Text strong style={{ fontSize: 12, color: c.textSecondary, display: "block", marginBottom: 8 }}>
              方案对比
            </Text>
            {plans.map((plan) => (
              <div key={plan.level} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Tag color={levelConfig[plan.level]?.color}>{plan.name}</Tag>
                <Text style={{ fontSize: 12, color: c.textTertiary }}>
                  ¥{plan.price_monthly}/月 · {plan.features.slice(0, 3).join("、")}
                </Text>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
