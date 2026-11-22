import React, { useState, useEffect, useRef } from 'react';

interface TypewriterMessageProps {
  content: string;
  isLatest: boolean;
  onScrollRequested?: () => void;
}

export const TypewriterMessage: React.FC<TypewriterMessageProps> = ({
  content,
  isLatest,
  onScrollRequested,
}) => {
  // Store scroll callback in ref so changes in callback reference never re-trigger typing
  const scrollCallbackRef = useRef(onScrollRequested);
  useEffect(() => {
    scrollCallbackRef.current = onScrollRequested;
  });

  // Track if this content has completed its typing animation so it NEVER repeats
  const completedContentRef = useRef<string | null>(!isLatest ? content : null);

  const [displayedLength, setDisplayedLength] = useState(() => (isLatest ? 0 : content.length));
  const [isTyping, setIsTyping] = useState(() => isLatest && completedContentRef.current !== content);

  useEffect(() => {
    // If not the latest message, or if this exact content already completed typing, show full text immediately
    if (!isLatest || completedContentRef.current === content) {
      setDisplayedLength(content.length);
      setIsTyping(false);
      return;
    }

    setDisplayedLength(0);
    setIsTyping(true);

    let current = 0;
    const total = content.length;
    // Adaptive step: smooth typing completed within ~1.2 seconds
    const step = Math.max(1, Math.ceil(total / 45));
    const intervalTime = 20;

    const interval = setInterval(() => {
      current += step;
      if (current >= total) {
        setDisplayedLength(total);
        setIsTyping(false);
        completedContentRef.current = content;
        clearInterval(interval);
      } else {
        setDisplayedLength(current);
      }
      scrollCallbackRef.current?.();
    }, intervalTime);

    return () => clearInterval(interval);
  }, [content, isLatest]);

  const displayedText = content.slice(0, displayedLength);

  return (
    <div className="whitespace-pre-line text-xs font-normal leading-relaxed">
      {displayedText}
      {isTyping && (
        <span
          className="inline-block w-1.5 h-3.5 bg-purple-500 dark:bg-purple-400 animate-pulse ml-0.5 align-middle rounded-xs"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default TypewriterMessage;
