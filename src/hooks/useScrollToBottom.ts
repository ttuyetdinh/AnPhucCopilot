'use client';

import { useCallback, useEffect, useRef } from 'react';

interface ScrollOptions {
  autoScroll?: boolean;
  smooth?: boolean;
}

export function useScrollToBottom<T extends HTMLElement = HTMLDivElement>(
  dependency: any,
  options: ScrollOptions = {}
) {
  const { autoScroll = true, smooth = true } = options;
  const ref = useRef<T>(null);

  const scrollToBottom = useCallback(() => {
    if (ref.current) {
      ref.current.scrollTo({
        top: ref.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, [smooth]);

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [dependency, autoScroll, scrollToBottom]);

  return { ref, scrollToBottom };
}
