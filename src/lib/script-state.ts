// Global state for script management
export interface ScriptState {
  status: "idle" | "running" | "waiting-2fa" | "completed" | "error";
  output: string;
  process: any;
}

// Use global to persist state across requests in development
declare global {
  var scriptState: ScriptState | undefined;
}

export const getScriptState = (): ScriptState => {
  if (!global.scriptState) {
    global.scriptState = {
      status: "idle",
      output: "",
      process: null,
    };
  }
  return global.scriptState;
};

export const updateScriptState = (updates: Partial<ScriptState>) => {
  const state = getScriptState();
  Object.assign(state, updates);
};
