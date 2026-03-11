'use client';

import { useState } from 'react';
import { Modal, Alert, Input, Button, Space, Typography, Divider } from 'antd';
import {
  CopyOutlined,
  DownloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface KeyRevealModalProps {
  open: boolean;
  apiKey: string;
  keyName: string;
  onClose: () => void;
}

export default function KeyRevealModal({ open, apiKey, keyName, onClose }: KeyRevealModalProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadEnv = () => {
    const content = `# DMDS API Key — ${keyName}\nDMDS_API_KEY=${apiKey}\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `.env.dmds`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setRevealed(false);
    setCopied(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={
        <Button type="primary" onClick={handleClose} size="large" block>
          I've saved my key — Close
        </Button>
      }
      closable={false}
      maskClosable={false}
      width={520}
      title={
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          <span>API Key Created — {keyName}</span>
        </Space>
      }
    >
      <Alert
        type="warning"
        icon={<span>⚠️</span>}
        showIcon
        message="Store this key now"
        description="For your security, we will not show this secret again. Copy it or download the .env file before closing."
        style={{ marginBottom: 20 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>
          Your API Key
        </Text>
        <Input
          value={revealed ? apiKey : '•'.repeat(Math.min(apiKey.length, 48))}
          readOnly
          style={{ fontFamily: 'monospace', fontSize: 13 }}
          suffix={
            <Button
              type="text"
              icon={revealed ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => setRevealed(!revealed)}
              size="small"
            />
          }
        />
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <Space style={{ width: '100%' }} direction="vertical">
        <Button
          icon={copied ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />}
          onClick={handleCopy}
          block
          size="large"
        >
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </Button>
        <Button
          icon={<DownloadOutlined />}
          onClick={handleDownloadEnv}
          block
          size="large"
        >
          Download .env file
        </Button>
      </Space>
    </Modal>
  );
}
