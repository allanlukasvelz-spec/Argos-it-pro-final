"use client";

import ChicoDumboSpriteSystem from "./mascots/ChicoDumboSpriteSystem";
import MascotChatPanel from "./mascots/MascotChatPanel";

/** Dock + chat panel. Provider lives in SiteShell so pages can open Dumbo/Chico. */
export default function ClientAssistants() {
  return (
    <>
      <ChicoDumboSpriteSystem />
      <MascotChatPanel />
    </>
  );
}
