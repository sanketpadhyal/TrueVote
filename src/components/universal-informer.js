import React, { useState, useEffect, useCallback, useRef } from 'react';

const EVENT_NAME = 'truevote_informer_event';

export function inform(message, type = 'info', options = {}) {
  if (typeof window === 'undefined') return;

  const event = new CustomEvent(EVENT_NAME, {
    detail: {
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      message: String(message || ''),
      type: ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info',
      title: options.title || '',
      duration: typeof options.duration === 'number' ? options.duration : 4500,
    },
  });

  window.dispatchEvent(event);
}

export const informSuccess = (message, title = 'Success', options = {}) =>
  inform(message, 'success', { title, ...options });

export const informError = (message, title = 'Error', options = {}) =>
  inform(message, 'error', { title, ...options });

export const informWarning = (message, title = 'Notice', options = {}) =>
  inform(message, 'warning', { title, ...options });

export const informInfo = (message, title = 'Information', options = {}) =>
  inform(message, 'info', { title, ...options });

if (typeof window !== 'undefined') {
  window.inform = inform;
  window.informSuccess = informSuccess;
  window.informError = informError;
  window.informWarning = informWarning;
  window.informInfo = informInfo;
}

const INFORMER_STYLES = `
.tv-informer-container {
  position: fixed;
  top: 20px;
  right: 24px;
  z-index: 999999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
  max-width: 380px;
  width: calc(100vw - 48px);
}

.tv-informer-toast {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 16px;
  box-shadow: 0 16px 32px -8px rgba(15, 23, 42, 0.15), 0 4px 12px rgba(15, 23, 42, 0.06);
  pointer-events: auto;
  overflow: hidden;
  transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1),
              opacity 0.28s ease,
              max-height 0.32s ease,
              margin 0.32s ease,
              padding 0.32s ease;
  transform-origin: top right;
  animation: tvToastEnter 0.38s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.tv-informer-toast.is-exiting {
  animation: tvToastExit 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.tv-informer-toast.type-success {
  border-left: 4px solid #10b981;
}

.tv-informer-toast.type-error {
  border-left: 4px solid #ef4444;
}

.tv-informer-toast.type-warning {
  border-left: 4px solid #f59e0b;
}

.tv-informer-toast.type-info {
  border-left: 4px solid #0ea5e9;
}

.tv-informer-icon-badge {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

.type-success .tv-informer-icon-badge {
  background: #ecfdf5;
  color: #10b981;
}

.type-error .tv-informer-icon-badge {
  background: #fef2f2;
  color: #ef4444;
}

.type-warning .tv-informer-icon-badge {
  background: #fffbeb;
  color: #f59e0b;
}

.type-info .tv-informer-icon-badge {
  background: #f0f9ff;
  color: #0284c7;
}

.tv-informer-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.tv-informer-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
  margin: 0 0 3px 0;
  letter-spacing: -0.01em;
}

.tv-informer-message {
  font-size: 12.5px;
  font-weight: 500;
  color: #475569;
  line-height: 1.45;
  margin: 0;
  word-break: break-word;
}

.tv-informer-close-btn {
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  margin: -4px -6px 0 0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease, background 0.15s ease;
  line-height: 1;
}

.tv-informer-close-btn:hover {
  color: #334155;
  background: rgba(241, 245, 249, 0.8);
}

.tv-informer-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2.5px;
  background: rgba(0, 0, 0, 0.05);
}

.tv-informer-progress-fill {
  height: 100%;
  width: 100%;
  transform-origin: left center;
  animation: tvToastProgress linear forwards;
}

.type-success .tv-informer-progress-fill {
  background: #10b981;
}

.type-error .tv-informer-progress-fill {
  background: #ef4444;
}

.type-warning .tv-informer-progress-fill {
  background: #f59e0b;
}

.type-info .tv-informer-progress-fill {
  background: #0ea5e9;
}

.tv-informer-toast:hover .tv-informer-progress-fill {
  animation-play-state: paused;
}

@keyframes tvToastEnter {
  0% {
    opacity: 0;
    transform: translate3d(115%, 0, 0) scale(0.92);
  }
  70% {
    transform: translate3d(-6px, 0, 0) scale(1.01);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes tvToastExit {
  0% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
    max-height: 140px;
    margin-bottom: 12px;
  }
  100% {
    opacity: 0;
    transform: translate3d(115%, 0, 0) scale(0.92);
    max-height: 0;
    margin-bottom: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
}

@keyframes tvToastProgress {
  0% {
    transform: scaleX(1);
  }
  100% {
    transform: scaleX(0);
  }
}

@media (max-width: 640px) {
  .tv-informer-container {
    top: max(12px, env(safe-area-inset-top));
    left: 12px;
    right: 12px;
    width: auto;
    max-width: none;
    align-items: center;
  }

  .tv-informer-toast {
    width: 100%;
    transform-origin: top center;
    animation: tvToastMobileEnter 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .tv-informer-toast.is-exiting {
    animation: tvToastMobileExit 0.28s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
}

@keyframes tvToastMobileEnter {
  0% {
    opacity: 0;
    transform: translate3d(0, -120%, 0) scale(0.94);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes tvToastMobileExit {
  0% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
    max-height: 140px;
  }
  100% {
    opacity: 0;
    transform: translate3d(0, -120%, 0) scale(0.94);
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
}
`;

function getToastIcon(type) {
  switch (type) {
    case 'success':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case 'error':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    case 'warning':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'info':
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
  }
}

const InformerToast = React.memo(({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(toast.duration || 4500);
  const isPausedRef = useRef(false);

  const triggerDismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 300);
  }, [onDismiss, toast.id]);

  const startDismissTimer = useCallback(() => {
    if (!toast.duration || toast.duration <= 0) return;
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      triggerDismiss();
    }, remainingTimeRef.current);
  }, [toast.duration, triggerDismiss]);

  useEffect(() => {
    startDismissTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startDismissTimer]);

  const handleMouseEnter = () => {
    if (!toast.duration || toast.duration <= 0) return;
    isPausedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
  };

  const handleMouseLeave = () => {
    if (!toast.duration || toast.duration <= 0 || !isPausedRef.current) return;
    isPausedRef.current = false;
    startDismissTimer();
  };

  return (
    <div
      className={`tv-informer-toast type-${toast.type} ${isExiting ? 'is-exiting' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="status"
      aria-live="polite"
    >
      <div className="tv-informer-icon-badge">
        {getToastIcon(toast.type)}
      </div>

      <div className="tv-informer-content">
        {toast.title && <div className="tv-informer-title">{toast.title}</div>}
        <div className="tv-informer-message">{toast.message}</div>
      </div>

      <button
        type="button"
        className="tv-informer-close-btn"
        onClick={triggerDismiss}
        aria-label="Dismiss notification"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {toast.duration > 0 && (
        <div className="tv-informer-progress-bar">
          <div
            className="tv-informer-progress-fill"
            style={{ animationDuration: `${toast.duration}ms` }}
          />
        </div>
      )}
    </div>
  );
});

export default function UniversalInformer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleInformerEvent = (e) => {
      if (!e.detail) return;
      const newToast = e.detail;

      setToasts((prev) => {

        const truncated = prev.length >= 5 ? prev.slice(prev.length - 4) : prev;
        return [...truncated, newToast];
      });
    };

    window.addEventListener(EVENT_NAME, handleInformerEvent);
    return () => {
      window.removeEventListener(EVENT_NAME, handleInformerEvent);
    };
  }, []);

  const handleDismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <>
      <style>{INFORMER_STYLES}</style>
      <div className="tv-informer-container" aria-label="Notifications">
        {toasts.map((toast) => (
          <InformerToast
            key={toast.id}
            toast={toast}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </>
  );
}

