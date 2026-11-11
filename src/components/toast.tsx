import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

const ToastContext = createContext<(message: string) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((text: string) => {
    setMessage(text);
    setVisible(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 1500);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={`toast${visible ? " show" : ""}`} role="status" aria-live="polite">{message}</div>
    </ToastContext.Provider>
  );
}

const CopyIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25ZM5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" /></svg>
);

// name stands in for the text on the button and in the toast, for text too long to show, such as a list.
export function CopyButton({ text, name, className = "" }: { text: string; name?: string; className?: string }) {
  const notify = useContext(ToastContext);
  const [label, setLabel] = useState("Copy");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setLabel("Copied");
      notify(`Copied ${name ?? text}`);
    } catch {
      setLabel("Copy failed");
      notify("Copy failed — select the text instead");
    }
    setTimeout(() => setLabel("Copy"), 1500);
  };
  return (
    <button type="button" className={`btn ${className}`.trim()} onClick={copy}>
      <CopyIcon />
      <span>{label}</span> {name ? <span>{name}</span> : <code>{text}</code>}
    </button>
  );
}
