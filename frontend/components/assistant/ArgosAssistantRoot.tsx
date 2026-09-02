"use client";

import ArgosAssistantLauncher from "@/components/assistant/ArgosAssistantLauncher";
import ArgosAssistantPanel from "@/components/assistant/ArgosAssistantPanel";
import { ArgosAssistantProvider } from "@/components/assistant/ArgosAssistantContext";
import "@/assets/css/argos-assistant.css";

/** Public ARGOS conversational assistant (server-backed). Separate from mascot dock chat. */
export default function ArgosAssistantRoot() {
  return (
    <ArgosAssistantProvider>
      <div id="argos-assistant-root">
        <ArgosAssistantLauncher />
        <ArgosAssistantPanel />
      </div>
    </ArgosAssistantProvider>
  );
}
