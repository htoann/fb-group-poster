import { NextApiRequest, NextApiResponse } from "next";
import { getScriptState } from "../../lib/script-state";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const state = getScriptState();

  res.status(200).json({
    status: state.status,
    output: state.output,
    timestamp: new Date().toISOString(),
    isRunning: !!state.process,
  });
}
