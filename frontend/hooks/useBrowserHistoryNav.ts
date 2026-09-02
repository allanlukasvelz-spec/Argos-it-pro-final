"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const STACK_KEY = "argos.nav.history.stack";

type StackState = {
  urls: string[];
  cursor: number;
};

function readStack(): StackState {
  try {
    const raw = sessionStorage.getItem(STACK_KEY);
    if (!raw) return { urls: [], cursor: 0 };
    const parsed = JSON.parse(raw) as StackState;
    if (
      Array.isArray(parsed?.urls) &&
      typeof parsed.cursor === "number" &&
      parsed.cursor >= 0 &&
      parsed.urls.every((u) => typeof u === "string")
    ) {
      return {
        urls: parsed.urls,
        cursor: Math.min(parsed.cursor, Math.max(0, parsed.urls.length - 1))
      };
    }
  } catch {
    /* ignore */
  }
  return { urls: [], cursor: 0 };
}

function writeStack(stack: StackState) {
  try {
    sessionStorage.setItem(STACK_KEY, JSON.stringify(stack));
  } catch {
    /* ignore */
  }
}

function currentUrl(pathname: string, search: string) {
  return search ? `${pathname}?${search}` : pathname;
}

/**
 * Anterior/Siguiente = history.back() / history.forward().
 * Stack ligero de URLs en sessionStorage para enabled/disabled
 * (Next puede sobrescribir history.state).
 */
export function useBrowserHistoryNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const isPopRef = useRef(false);

  useEffect(() => {
    const onPop = () => {
      isPopRef.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const search = searchParams?.toString() ?? "";
    const url = currentUrl(pathname, search);
    let stack = readStack();

    const syncButtons = (next: StackState) => {
      writeStack(next);
      setCanGoBack(next.cursor > 0);
      setCanGoForward(next.cursor < next.urls.length - 1);
    };

    if (isPopRef.current) {
      isPopRef.current = false;
      if (stack.cursor > 0 && stack.urls[stack.cursor - 1] === url) {
        stack = { ...stack, cursor: stack.cursor - 1 };
      } else if (
        stack.cursor < stack.urls.length - 1 &&
        stack.urls[stack.cursor + 1] === url
      ) {
        stack = { ...stack, cursor: stack.cursor + 1 };
      } else {
        const found = stack.urls.lastIndexOf(url);
        if (found >= 0) {
          stack = { ...stack, cursor: found };
        }
      }
      syncButtons(stack);
      return;
    }

    // Misma URL (Strict Mode / re-render): no empujar.
    if (stack.urls[stack.cursor] === url) {
      syncButtons(stack);
      return;
    }

    // Push: corta forward y añade URL.
    const kept = stack.urls.slice(0, stack.cursor + 1);
    if (kept[kept.length - 1] === url) {
      stack = { urls: kept, cursor: kept.length - 1 };
    } else {
      kept.push(url);
      stack = { urls: kept, cursor: kept.length - 1 };
    }
    syncButtons(stack);
  }, [pathname, searchParams]);

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    window.history.back();
  }, [canGoBack]);

  const goForward = useCallback(() => {
    if (!canGoForward) return;
    window.history.forward();
  }, [canGoForward]);

  return { canGoBack, canGoForward, goBack, goForward };
}
