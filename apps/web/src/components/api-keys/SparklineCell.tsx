'use client';

import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useApiKeySparkline } from '@/hooks/useApiKeys';

export default function SparklineCell({ apiKeyId }: { apiKeyId: string }) {
  const { data, isLoading } = useApiKeySparkline(apiKeyId);

  if (isLoading || !data) {
    return <div style={{ width: 120, height: 40, background: '#f5f5f5', borderRadius: 4 }} />;
  }

  const hasActivity = data.some((d) => d.count > 0);

  return (
    <ResponsiveContainer width={120} height={40}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={`grad-${apiKeyId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1677ff" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{ fontSize: 11, padding: '2px 8px' }}
          formatter={(val: number) => [val, 'requests']}
          labelFormatter={(label: string) => label}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke={hasActivity ? '#1677ff' : '#d9d9d9'}
          strokeWidth={1.5}
          fill={`url(#grad-${apiKeyId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
