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
}

export default function Home() {
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);
  const [postContent, setPostContent] = useState<string>('');

  const handleSelectionChange = (groups: Group[]) => setSelectedGroups(groups);

  const handlePostToSelectedGroups = async () => {
    if (!selectedGroups.length) return alert('Please select at least one group.');
    if (!postContent.trim()) return alert('Please enter post content.');

    console.log('Posting to selected groups:', selectedGroups);
    console.log('Post content:', postContent);
    alert(`Ready to post to ${selectedGroups.length} group(s)!\n\nContent:\n${postContent}`);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Content style={{ padding: '32px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Title level={1} style={{ marginBottom: 8 }}>
            🚀 Facebook Group Poster
          </Title>
          <Paragraph type="secondary">Select your Facebook groups and post content automatically.</Paragraph>
        </div>

        {/* Group Selector */}
        <div style={{ marginBottom: 32 }}>
          <GroupSelector onSelectionChange={handleSelectionChange} />
        </div>

        {/* Selected Groups & Content */}
        {selectedGroups.length > 0 && (
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <Collapse
              bordered={false}
              style={{ marginBottom: 24 }}
              items={[
                {
                  key: '1',
                  label: `Selected Groups (${selectedGroups.length})`,
                  children: (
                    <div>
                      {selectedGroups.map((g, i) => (
                        <Text key={g.id} style={{ display: 'block', padding: '4px 0' }}>
                          {i + 1}. {g.name}
                        </Text>
                      ))}
                    </div>
                  ),
                },
              ]}
            />

            <textarea
              placeholder="Enter your post content..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: 16,
                borderRadius: 6,
                border: '1px solid #d9d9d9',
                minHeight: 140,
                resize: 'vertical',
                marginBottom: 16,
              }}
            />

            <Button
              type="primary"
              size="large"
              icon={<RocketOutlined />}
              onClick={handlePostToSelectedGroups}
              style={{
                width: '100%',
                background: '#52c41a',
                borderColor: '#52c41a',
                fontSize: 16,
                height: 48,
              }}
            >
              Post to {selectedGroups.length} Group{selectedGroups.length > 1 ? 's' : ''}
            </Button>
          </div>
        )}
      </Content>
    </Layout>
  );
}
