import { NextApiRequest, NextApiResponse } from "next";
import { getScriptState, updateScriptState } from "../../lib/script-state";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const state = getScriptState();

  if (!state.process || state.status !== "waiting-2fa") {
    return res.status(400).json({
      error: "No script waiting for 2FA continuation",
      status: state.status,
    });
  }

  // Send Enter key to continue the script
  try {
    state.process.stdin?.write("\n");
    updateScriptState({ status: "running" });

    res.status(200).json({
      message: "Successfully sent continue signal to script",
      status: "running",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to send continue signal",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
