'use client';

import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Affix, Alert, Button, Card, Checkbox, Col, Empty, Input, Row, Skeleton, Space, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

const { Title, Text } = Typography;

interface Group {
  id: string;
  name: string;
  url: string;
}

interface GroupSelectorProps {
  onSelectionChange?: (selectedGroups: Group[]) => void;
}

export const fakeGroups: Group[] = Array.from({ length: 50 }).map((_, i) => ({
  id: String(i + 1),
  name: `Facebook Group ${i + 1}`,
  url: `https://www.facebook.com/groups/${i + 1}`,
}));

export default function GroupSelector({ onSelectionChange }: GroupSelectorProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [search, setSearch] = useState('');

  const filteredGroups = useMemo(
    () => groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase())),
    [groups, search],
  );

  useEffect(() => {
    const storedGroups = localStorage.getItem('groups');
    if (storedGroups) {
      setGroups(JSON.parse(storedGroups));
    }
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/get-groups');
      const data = await res.json();
      if (Array.isArray(data)) {
        setGroups(data);
        localStorage.setItem('groups', JSON.stringify(data));
      } else {
        setError(data.message || 'Failed to fetch groups');
      }
    } catch {
      setError('Network error occurred while fetching groups');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupToggle = (groupId: string) => {
    const newSelected = new Set(selectedGroups);
    newSelected.has(groupId) ? newSelected.delete(groupId) : newSelected.add(groupId);
    setSelectedGroups(newSelected);
    setSelectAll(newSelected.size === groups.length && groups.length > 0);
    onSelectionChange?.(groups.filter((g) => newSelected.has(g.id)));
  };

  const handleSelectAll = () => {
    const allSelected = !selectAll;
    setSelectAll(allSelected);
    const newSelected = allSelected ? new Set(groups.map((g) => g.id)) : new Set<string>();
    setSelectedGroups(newSelected);
    onSelectionChange?.(groups.filter((g) => newSelected.has(g.id)));
  };

  useEffect(() => {
    if (groups.length > 0) setSelectAll(selectedGroups.size === groups.length);
  }, [groups, selectedGroups]);

  return (
    <div style={{ maxWidth: 950, margin: '0 auto', padding: 24 }}>
      <Card
        bordered={false}
        style={{
          borderRadius: 14,
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          background: 'linear-gradient(180deg, #ffffff, #fafafa)',
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <Title level={3} style={{ margin: 0 }}>
              Facebook Groups
            </Title>

            <Affix offsetTop={20}>
              {selectedGroups.size > 0 && (
                <Tag color="blue" style={{ fontSize: 13, borderRadius: 6, padding: '0 8px' }}>
                  {selectedGroups.size} selected
                </Tag>
              )}
            </Affix>

            <Space>
              <Input
                autoFocus
                prefix={<SearchOutlined />}
                placeholder="Search groups..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
                style={{
                  borderRadius: 8,
                  width: 280,
                  boxShadow: search ? '0 0 5px rgba(0,0,0,0.1)' : undefined,
                }}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchGroups}
                loading={loading}
                type="default"
                style={{ borderRadius: 8 }}
              >
                Refresh groups
              </Button>
            </Space>
          </div>
        </Space>
      </Card>

      {error && (
        <Alert
          type="error"
          message="Error"
          description={error}
          showIcon
          style={{ marginTop: 20, borderRadius: 12, textAlign: 'center' }}
        />
      )}

      <Card
        bordered={false}
        style={{
          marginTop: 16,
          borderRadius: 14,
          background: '#fff',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Sticky control bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 16px',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: '#fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          }}
        >
          <Checkbox checked={selectAll} onChange={handleSelectAll} title="Select all visible groups">
            Select All ({groups.length})
          </Checkbox>
          <Text type="secondary">{filteredGroups.length} results</Text>
        </div>

        {/* Group list */}
        <div style={{ padding: 16, maxHeight: 500, overflowY: 'auto' }}>
          {loading ? (
            <Row gutter={[16, 16]}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Col span={8} key={i}>
                  <Card
                    style={{
                      borderRadius: 10,
                      opacity: 0,
                      animation: 'fadeIn 0.3s forwards',
                    }}
                  >
                    <Skeleton active paragraph={{ rows: 1 }} />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : filteredGroups.length > 0 ? (
            <Row gutter={[16, 16]}>
              {filteredGroups.map((group) => {
                const checked = selectedGroups.has(group.id);
                return (
                  <Col xs={24} sm={12} md={8} lg={6} key={group.id}>
                    <Card
                      hoverable
                      onClick={() => handleGroupToggle(group.id)}
                      style={{
                        borderRadius: 10,
                        transition: 'all 0.2s ease',
                        background: checked ? '#e6f7ff' : '#fff',
                        border: checked ? '1px solid #1677ff' : '1px solid #f0f0f0',
                        boxShadow: checked ? '0 4px 8px rgba(0, 119, 255, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                        cursor: 'pointer',
                      }}
                      bodyStyle={{ padding: 14 }}
                    >
                      <Space direction="vertical" size={4}>
                        <Checkbox checked={checked} onClick={(e) => e.stopPropagation()}>
                          <Text strong>
                            {search
                              ? group.name.replace(new RegExp(search, 'gi'), (match) => `<mark>${match}</mark>`)
                              : group.name}
                          </Text>
                        </Checkbox>
                      </Space>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <Empty
              description="No groups found"
              style={{ padding: 80, textAlign: 'center' }}
              imageStyle={{ height: 80 }}
            />
          )}
        </div>
      </Card>

      <style>{`
        mark {
          background-color: #ffe58f;
          padding: 0 2px;
          border-radius: 2px;
        }
        @keyframes fadeIn {
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
