'use client';

import { RocketOutlined } from '@ant-design/icons';
import { Button, Collapse, Layout, Typography } from 'antd';
import { useState } from 'react';
import GroupSelector from '../components/GroupSelector';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

interface Group {
  id: string;
  name: string;
  url: string;
  memberCount?: string;
}

export default function Home() {
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);

  const handleSelectionChange = (groups: Group[]) => {
    setSelectedGroups(groups);
  };

  const handlePostToSelectedGroups = async () => {
    if (selectedGroups.length === 0) {
      alert('Please select at least one group to post to.');
      return;
    }

    // Here you can implement the posting logic
    // For now, just show which groups are selected
    console.log('Posting to selected groups:', selectedGroups);
    alert(`Ready to post to ${selectedGroups.length} selected groups!`);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Content
        style={{
          padding: '32px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={1} style={{ marginBottom: 8 }}>
            Facebook Group Poster
          </Title>
          <Paragraph style={{ fontSize: '16px', color: 'rgba(0, 0, 0, 0.65)' }}>
            Select Facebook groups and post to them automatically
          </Paragraph>
        </div>

        {/* Group Selector */}
        <div style={{ marginBottom: 32 }}>
          <GroupSelector onSelectionChange={handleSelectionChange} />
        </div>

        {/* Action Buttons */}
        {selectedGroups.length > 0 && (
          <div style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<RocketOutlined />}
              onClick={handlePostToSelectedGroups}
              style={{
                background: '#52c41a',
                borderColor: '#52c41a',
                fontSize: '16px',
                height: '48px',
                padding: '0 24px',
              }}
            >
              Post to {selectedGroups.length} Selected Group
              {selectedGroups.length !== 1 ? 's' : ''}
            </Button>

            <div style={{ marginTop: 16 }}>
              <Collapse
                size="small"
                items={[
                  {
                    key: '1',
                    label: `View Selected Groups (${selectedGroups.length})`,
                    children: (
                      <div
                        style={{
                          textAlign: 'left',
                          maxWidth: 600,
                          margin: '0 auto',
                        }}
                      >
                        {selectedGroups.map((group, index) => (
                          <div
                            key={group.id}
                            style={{
                              padding: '4px 8px',
                              borderBottom: index === selectedGroups.length - 1 ? 'none' : '1px solid #f0f0f0',
                            }}
                          >
                            <Text>
                              {index + 1}. {group.name}
                            </Text>
                          </div>
                        ))}
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        )}
      </Content>
    </Layout>
  );
}
