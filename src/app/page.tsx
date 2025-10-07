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

  const handleSelectionChange = (groups: Group[]) => {
    setSelectedGroups(groups);
  };

  const handlePostToSelectedGroups = async () => {
    if (selectedGroups.length === 0) {
      alert('Please select at least one group to post to.');
      return;
    }

    if (!postContent) {
      alert('Please enter the content you want to post.');
      return;
    }

    // For now, just show which groups are selected and the content
    console.log('Posting to selected groups:', selectedGroups);
    console.log('Post content:', postContent);
    alert(`Ready to post to ${selectedGroups.length} selected group(s)!\n\nContent:\n${postContent}`);
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

            {/* Post Content Input */}
            <div className="post-content" style={{ marginTop: 32 }}>
              <textarea
                placeholder="Enter your post content"
                className="post-input"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  borderRadius: '4px',
                  border: '1px solid #d9d9d9',
                  marginBottom: 8,
                  minHeight: 120,
                  resize: 'vertical',
                }}
              />
              <Button
                type="primary"
                size="large"
                onClick={handlePostToSelectedGroups}
                style={{
                  width: '100%',
                  background: '#52c41a',
                  borderColor: '#52c41a',
                  fontSize: '16px',
                  height: '48px',
                }}
              >
                Post
              </Button>
            </div>
          </div>
        )}
      </Content>
    </Layout>
  );
}
