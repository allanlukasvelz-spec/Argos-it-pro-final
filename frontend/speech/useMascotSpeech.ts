"use client";

import { useCallback } from "react";

export function useMascotSpeech() {
  return useCallback((text: string, voice: "chico" | "dumbo") => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = `${document.documentElement.lang || "es"}-${(document.documentElement.lang || "es").toUpperCase()}`;
    utterance.rate = 1;
    utterance.pitch = voice === "chico" ? 0.9 : 1.06;
    window.speechSynthesis.speak(utterance);
  }, []);
}
