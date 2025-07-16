import { useEffect, useRef, useCallback, type RefObject } from "react";

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T>,
  RefObject<T>,
  () => void,
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);

  const scrollToBottom = useCallback(() => {
    const end = endRef.current;
    if (end) {
      end.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      const isAtBottom = () => {
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        
        // Consider "at bottom" if within 100px of the bottom
        return scrollTop + clientHeight >= scrollHeight - 100;
      };

      const observer = new MutationObserver(() => {
        // Only auto-scroll if user is already at or near the bottom
        if (isAtBottom()) {
          end.scrollIntoView({ behavior: "auto", block: "end" });
        }
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      return () => observer.disconnect();
    }
  }, []);

  return [containerRef, endRef, scrollToBottom];
}
