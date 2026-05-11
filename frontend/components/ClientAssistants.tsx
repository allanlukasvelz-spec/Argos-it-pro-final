"use client";

import ChicoDumboSpriteSystem from "./mascots/ChicoDumboSpriteSystem";
import { MascotChatProvider } from "./mascots/MascotChatContext";
import MascotChatPanel from "./mascots/MascotChatPanel";

export default function ClientAssistants() {
  return (
    <MascotChatProvider>
      <ChicoDumboSpriteSystem />
      <MascotChatPanel />
    </MascotChatProvider>
  );
}
