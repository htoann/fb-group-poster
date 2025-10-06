"use client";
import {
  CheckCircleOutlined,
  KeyOutlined,
  LoadingOutlined,
  LockOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Divider,
  Layout,
  List,
  Space,
  Steps,
  Typography,
} from "antd";
import { useEffect, useRef, useState } from "react";

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

export default function RunScriptPage() {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState("idle"); // idle, login, 2fa, running, complete
  const [isRunning, setIsRunning] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Polling function to check script status
  const checkScriptStatus = async () => {
    try {
      const res = await fetch("/api/script-status");
      const data = await res.json();
      if (res.ok) {
        setStep(data.status);
        setOutput(data.output);
        setIsRunning(data.isRunning);

        // Stop polling if script is completed or errored
        if (data.status === "completed" || data.status === "error") {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      }
    } catch (_error) {
      console.error("Error checking script status:", _error);
    }
  };

  // Start polling when component mounts and script is running
  useEffect(() => {
    if (isRunning && !pollingRef.current) {
      pollingRef.current = setInterval(checkScriptStatus, 2000); // Poll every 2 seconds
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isRunning]);

  const handleRunScript = async () => {
    setLoading(true);
    setOutput("");
    setError("");
    setIsRunning(true);

    try {
      const res = await fetch("/api/run-script", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setOutput(data.output || data.message);
        setStep("running");
        // Start polling
        if (!pollingRef.current) {
          pollingRef.current = setInterval(checkScriptStatus, 2000);
        }
      } else {
        setError(data.error || "An error occurred");
        setStep("idle");
        setIsRunning(false);
      }
    } catch (error) {
      setError("Unable to connect to server");
      setStep("idle");
      setIsRunning(false);
    }

    setLoading(false);
  };

  const handleContinueAfter2FA = async () => {
    try {
      const res = await fetch("/api/continue-script", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setOutput((prev) => prev + "\n✅ Continuing after 2FA verification...");
        // Continue polling to get updated status
      } else {
        setError(data.error || "Error continuing script");
      }
    } catch {
      setError("Unable to continue script");
    }
  };

  const handleReset = () => {
    setStep("idle");
    setLoading(false);
    setIsRunning(false);
    setOutput("");
    setError("");

    // Stop polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Content
        style={{
          padding: "32px",
          maxWidth: 900,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <Title level={1}>Facebook Group Auto Post</Title>

        <Alert
          message="⚠️ Important Notes"
          description={
            <List
              size="small"
              dataSource={[
                "This script needs to open a browser to login to Facebook",
                "After entering 2FA code: Script will automatically click 'Continue' buttons",
                "If there are cookie popups or other notifications, the script will automatically close them",
                "Script will verify successful login before continuing",
                "Ensure login credentials in the script are correct",
              ]}
              renderItem={(item) => (
                <List.Item style={{ padding: "4px 0" }}>{item}</List.Item>
              )}
            />
          }
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Card style={{ marginBottom: 24 }}>
          <Title level={3}>Script Controls</Title>

          {/* Status indicator */}
          {step !== "idle" && (
            <Alert
              message="Status"
              description={
                <>
                  {step === "login" && (
                    <Space>
                      <LockOutlined />
                      <Text>Logging into Facebook...</Text>
                    </Space>
                  )}
                  {step === "2fa" && (
                    <Space>
                      <KeyOutlined />
                      <Text>Waiting for 2FA verification...</Text>
                    </Space>
                  )}
                  {step === "running" && (
                    <Space>
                      <LoadingOutlined spin />
                      <Text>Posting to groups...</Text>
                    </Space>
                  )}
                  {step === "complete" && (
                    <Space>
                      <CheckCircleOutlined />
                      <Text>Complete!</Text>
                    </Space>
                  )}
                </>
              }
              type={step === "complete" ? "success" : "info"}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Space wrap style={{ marginBottom: 16 }}>
            {/* Start Script Button */}
            {step === "idle" && (
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={handleRunScript}
                loading={loading}
              >
                {loading ? "Starting..." : "Run Script"}
              </Button>
            )}

            {/* Continue after 2FA Button */}
            {(step === "login" || step === "2fa") && (
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={handleContinueAfter2FA}
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              >
                Continue After 2FA
              </Button>
            )}

            {/* Reset Button */}
            {step !== "idle" && (
              <Button
                size="large"
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                Reset
              </Button>
            )}
          </Space>

          {/* Instructions for button usage */}
          <Alert
            message="📖 Usage Instructions"
            description={
              <Steps
                direction="vertical"
                size="small"
                current={-1}
                items={[
                  {
                    title: 'Click "Run Script" to start',
                    icon: <PlayCircleOutlined />,
                  },
                  {
                    title: "A browser will open, login to Facebook manually",
                    icon: <LockOutlined />,
                  },
                  {
                    title: 'After completing 2FA, click "Continue After 2FA"',
                    icon: <KeyOutlined />,
                  },
                  {
                    title: "Script will automatically post to groups",
                    icon: <SettingOutlined />,
                  },
                ]}
              />
            }
            type="info"
            style={{ marginBottom: 16 }}
          />

          <Divider />

          <Paragraph>
            <Text strong>Or run directly in terminal:</Text>
          </Paragraph>
          <Card
            style={{
              backgroundColor: "#f8f9fa",
              border: "1px solid #e9ecef",
              fontFamily: "monospace",
              fontSize: "14px",
            }}
          >
            <Text code>cd C:\Users\clay.tran\Desktop\Test</Text>
            <br />
            <Text code>node postToAllJoinedGroups.js</Text>
          </Card>
        </Card>

        {output && (
          <Card style={{ marginTop: 24 }}>
            <Title level={4}>Result</Title>
            <Card
              style={{
                backgroundColor: "#f6ffed",
                border: "1px solid #b7eb8f",
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
              }}
            >
              {output}
            </Card>
          </Card>
        )}

        {error && (
          <Card style={{ marginTop: 24 }}>
            <Title level={4}>Error</Title>
            <Alert
              message="Error occurred"
              description={error}
              type="error"
              showIcon
            />
          </Card>
        )}
      </Content>
    </Layout>
  );
}
