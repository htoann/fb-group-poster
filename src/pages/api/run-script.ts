import { NextApiRequest, NextApiResponse } from "next";
import { getScriptState, updateScriptState } from "../../lib/script-state";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const state = getScriptState();

  if (state.status === "running") {
    return res.status(400).json({
      error: "Script is already running",
      status: state.status,
      output: state.output,
    });
  }

  try {
    // Reset state
    updateScriptState({
      output: "Script is starting...",
      status: "running",
      process: null,
    });

    console.log("Starting Facebook group posting script...");

    // Call the postToAllJoinedGroups API endpoint
    const baseUrl = req.headers.host?.includes("localhost")
      ? `http://${req.headers.host}`
      : `https://${req.headers.host}`;

    const response = await fetch(`${baseUrl}/api/postToAllJoinedGroups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();

    updateScriptState({
      output: result.message || "Script completed successfully",
      status: "completed",
    });

    console.log("Script completed successfully");
  } catch (error: any) {
    console.error("Script error:", error);
    updateScriptState({
      output: `Error: ${error.message}`,
      status: "error",
      process: null,
    });

    return res.status(500).json({
      error: "Script execution failed",
      message: error.message,
      status: "error",
    });
  }

  // Return immediately
  const currentState = getScriptState();
  res.status(200).json({
    message: "Script started successfully",
    status: currentState.status,
    output: currentState.output,
  });
}
