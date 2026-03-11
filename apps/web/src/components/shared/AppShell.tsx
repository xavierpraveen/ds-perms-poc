'use client';

import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Space } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
  KeyOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  DashboardOutlined,
} from '@ant-design/icons';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const navItems = [
  {
    key: '/dashboard/keys',
    icon: <KeyOutlined />,
    label: 'API Keys',
  },
  {
    key: '/dashboard/modules',
    icon: <AppstoreOutlined />,
    label: 'Modules',
  },
  {
    key: '/dashboard/logs',
    icon: <FileTextOutlined />,
    label: 'Request Logs',
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const selectedKey = navItems.find((item) => pathname.startsWith(item.key))?.key || '/dashboard/keys';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        style={{
          borderRight: '1px solid #f0f0f0',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          zIndex: 100,
          overflow: 'auto',
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: collapsed ? '16px 8px' : '16px 24px',
            borderBottom: '1px solid #f0f0f0',
            marginBottom: 8,
          }}
        >
          {collapsed ? (
            <DashboardOutlined style={{ fontSize: 20, color: '#1677ff' }} />
          ) : (
            <Space>
              <DashboardOutlined style={{ fontSize: 20, color: '#1677ff' }} />
              <Text strong style={{ fontSize: 14 }}>
                DMDS
              </Text>
            </Space>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={navItems}
          onClick={({ key }) => router.push(key)}
          style={{ border: 'none' }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <UserButton />
        </Header>

        <Content style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
