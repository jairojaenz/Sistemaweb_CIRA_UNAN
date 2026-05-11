import { createContext, useContext, useState, useCallback } from "react";
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaTimes } from "react-icons/fa";

const ToastContext = createContext(null);

const typeStyles = {
  success: { bg: "bg-green-600", icon: FaCheckCircle },
  error: { bg: "bg-red-600", icon: FaTimesCircle },
  warning: { bg: "bg-yellow-500", icon: FaExclamationTriangle },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => {
          const style = typeStyles[toast.type] || typeStyles.success;
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              className={`${style.bg} flex min-w-[300px] max-w-md items-center gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg animate-slide-in`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1">{toast.message}</span>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 rounded p-0.5 hover:bg-white/20"
              >
                <FaTimes className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
