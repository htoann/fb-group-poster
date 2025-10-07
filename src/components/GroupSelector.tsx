'use client';

import { GlobalOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Checkbox, Col, Input, Row, Skeleton, Space, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

const { Title, Text } = Typography;

interface Group {
  id: string;
  name: string;
  url: string;
  memberCount?: string;
}

interface GroupSelectorProps {
  onSelectionChange?: (selectedGroups: Group[]) => void;
}

const fakeGroups: Group[] = Array.from({ length: 12 }, (_, i) => ({
  id: `1000${i + 1}`,
  name: `Frontend Dev Community ${i + 1}`,
  url: `https://facebook.com/groups/fake${i + 1}`,
  memberCount: `${(i + 1) * 1000} members`,
}));

export default function GroupSelector({ onSelectionChange }: GroupSelectorProps) {
  const [groups, setGroups] = useState<Group[]>(fakeGroups);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [search, setSearch] = useState('');

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));
  }, [groups, search]);

  const fetchGroups = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/get-groups');
      const data = await res.json();

      if (data.success) setGroups(data.groups);
      else setError(data.message || 'Failed to fetch groups');
    } catch (err) {
      setError('Network error occurred while fetching groups');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupToggle = (groupId: string) => {
    const newSelected = new Set<string>(selectedGroups);
    newSelected.has(groupId) ? newSelected.delete(groupId) : newSelected.add(groupId);

    setSelectedGroups(newSelected);
    setSelectAll(newSelected.size === groups.length && groups.length > 0);

    onSelectionChange?.(groups.filter((g) => newSelected.has(g.id)));
  };

  const handleSelectAll = () => {
    const allSelected = !selectAll;
    setSelectAll(allSelected);
    const newSelected = allSelected ? new Set<string>(groups.map((g) => g.id)) : new Set<string>();
    setSelectedGroups(newSelected);
    onSelectionChange?.(groups.filter((g) => newSelected.has(g.id)));
  };

  useEffect(() => {
    if (groups.length > 0) setSelectAll(selectedGroups.size === groups.length);
  }, [groups, selectedGroups]);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={3} style={{ marginBottom: 0 }}>
            Facebook Groups
          </Title>

          <Space wrap>
            <Button type="primary" icon={<ReloadOutlined />} onClick={fetchGroups} loading={loading}>
              {loading ? 'Loading...' : 'Load Groups'}
            </Button>

            <Input
              prefix={<SearchOutlined />}
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
          </Space>

          {selectedGroups.size > 0 && (
            <Text type="secondary">
              {selectedGroups.size} of {groups.length} selected
            </Text>
          )}
        </Space>
      </Card>

      {error && <Alert type="error" message="Error" description={error} showIcon style={{ marginTop: 16 }} />}

      {/* Main Group List */}
      <Card
        style={{
          marginTop: 16,
          background: '#fafafa',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fff',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 16,
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          <Checkbox checked={selectAll} onChange={handleSelectAll}>
            Select All ({groups.length})
          </Checkbox>
          <Text type="secondary">{filteredGroups.length} groups found</Text>
        </div>

        {loading ? (
          <Row gutter={[16, 16]}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Col span={8} key={i}>
                <Card>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Row gutter={[16, 16]}>
            {filteredGroups.map((group) => (
              <Col xs={24} sm={12} md={8} key={group.id}>
                <Card
                  hoverable
                  style={{
                    background: selectedGroups.has(group.id) ? '#e6f7ff' : '#fff',
                    transition: '0.2s',
                  }}
                  onClick={() => handleGroupToggle(group.id)}
                >
                  <Space align="start">
                    <Checkbox checked={selectedGroups.has(group.id)} onChange={() => handleGroupToggle(group.id)} />
                    <div>
                      <Text strong>{group.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {group.memberCount}
                      </Text>
                      <br />
                      <a href={group.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>
                        <GlobalOutlined /> View Group
                      </a>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {!loading && filteredGroups.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Text type="secondary">No groups found</Text>
          </div>
        )}
      </Card>
    </div>
  );
}
