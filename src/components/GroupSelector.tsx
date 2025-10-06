"use client";

import { GlobalOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Divider,
  Space,
  Spin,
  Typography,
} from "antd";
import { useEffect, useState } from "react";

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

export default function GroupSelector({
  onSelectionChange,
}: GroupSelectorProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  // Fetch groups from API
  const fetchGroups = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/get-groups");
      const data = await response.json();

      if (data.success) {
        setGroups(data.groups);
      } else {
        setError(data.message || "Failed to fetch groups");
      }
    } catch (err) {
      setError("Network error occurred while fetching groups");
      console.error("Error fetching groups:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle individual checkbox change
  const handleGroupToggle = (groupId: string) => {
    const newSelected = new Set(selectedGroups);

    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
    } else {
      newSelected.add(groupId);
    }

    setSelectedGroups(newSelected);

    // Update select all state
    setSelectAll(newSelected.size === groups.length && groups.length > 0);

    // Notify parent component
    if (onSelectionChange) {
      const selectedGroupObjects = groups.filter((group) =>
        newSelected.has(group.id)
      );
      onSelectionChange(selectedGroupObjects);
    }
  };

  // Handle select all toggle
  const handleSelectAllToggle = () => {
    let newSelected: Set<string>;

    if (selectAll) {
      // Deselect all
      newSelected = new Set();
      setSelectAll(false);
    } else {
      // Select all
      newSelected = new Set(groups.map((group) => group.id));
      setSelectAll(true);
    }

    setSelectedGroups(newSelected);

    // Notify parent component
    if (onSelectionChange) {
      const selectedGroupObjects = groups.filter((group) =>
        newSelected.has(group.id)
      );
      onSelectionChange(selectedGroupObjects);
    }
  };

  // Update select all state when groups change
  useEffect(() => {
    if (groups.length > 0) {
      setSelectAll(selectedGroups.size === groups.length);
    }
  }, [groups, selectedGroups]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px" }}>
      <Card>
        <Title level={2}>Facebook Groups</Title>

        <Space direction="vertical" style={{ width: "100%" }}>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchGroups}
            loading={loading}
            size="large"
          >
            {loading ? "Loading Groups..." : "Load Groups"}
          </Button>

          {selectedGroups.size > 0 && (
            <Text type="secondary">
              {selectedGroups.size} of {groups.length} groups selected
            </Text>
          )}
        </Space>

        <Divider />
      </Card>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {groups.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          {/* Select All Header */}
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #f0f0f0",
              backgroundColor: "#fafafa",
            }}
          >
            <Checkbox checked={selectAll} onChange={handleSelectAllToggle}>
              <Text strong>Select All ({groups.length} groups)</Text>
            </Checkbox>
          </div>

          {/* Group List */}
          <div style={{ maxHeight: 384, overflowY: "auto" }}>
            {groups.map((group, index) => (
              <div
                key={group.id}
                style={{
                  padding: "16px",
                  borderBottom:
                    index === groups.length - 1 ? "none" : "1px solid #f0f0f0",
                  backgroundColor: selectedGroups.has(group.id)
                    ? "#e6f7ff"
                    : "transparent",
                  transition: "background-color 0.3s",
                }}
              >
                <Space align="start" style={{ width: "100%" }}>
                  <Checkbox
                    checked={selectedGroups.has(group.id)}
                    onChange={() => handleGroupToggle(group.id)}
                    style={{ marginTop: 2 }}
                  />
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: "14px" }}>
                      {group.name}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      ID: {group.id}
                    </Text>
                    <br />
                    <Button
                      type="link"
                      size="small"
                      icon={<GlobalOutlined />}
                      href={group.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: 0, height: "auto", fontSize: "12px" }}
                    >
                      View Group
                    </Button>
                  </div>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    #{index + 1}
                  </Text>
                </Space>
              </div>
            ))}
          </div>
        </Card>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "32px" }}>
          <Spin size="large" />
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">Fetching groups...</Text>
          </div>
        </div>
      )}

      {!loading && groups.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "32px" }}>
          <Text type="secondary">
            Click "Load Groups" to fetch your Facebook groups
          </Text>
        </div>
      )}
    </div>
  );
}
