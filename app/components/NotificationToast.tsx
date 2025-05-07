import React, { useState, useEffect } from "react";
import { Check, AlertTriangle, X, Info } from "lucide-react";

type NotificationType = "success" | "error" | "info" | "warning";

interface NotificationToastProps {
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // duration in milliseconds
  onClose?: () => void;
  isVisible: boolean;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  isVisible,
}) => {
  const [isShowing, setIsShowing] = useState(isVisible);

  useEffect(() => {
    setIsShowing(isVisible);

    let timer: NodeJS.Timeout;
    if (isVisible && duration > 0) {
      timer = setTimeout(() => {
        setIsShowing(false);
        if (onClose) onClose();
      }, duration);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isVisible, duration, onClose]);

  if (!isShowing) return null;

  const iconMap = {
    success: <Check size={16} className="text-green-500" />,
    error: <AlertTriangle size={16} className="text-red-500" />,
    warning: <AlertTriangle size={16} className="text-amber-500" />,
    info: <Info size={16} className="text-blue-500" />,
  };

  const colorMap = {
    success: {
      bg: "bg-green-50",
      border: "border-green-100",
      text: "text-green-800",
      textSecondary: "text-green-600",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-100",
      text: "text-red-800",
      textSecondary: "text-red-600",
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-100",
      text: "text-amber-800",
      textSecondary: "text-amber-600",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-100",
      text: "text-blue-800",
      textSecondary: "text-blue-600",
    },
  };

  const colors = colorMap[type];

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm animate-in fade-in slide-in-from-top duration-300">
      <div
        className={`${colors.bg} ${colors.border} border rounded-lg shadow-md p-4 flex items-start`}
      >
        <div className="flex-shrink-0 mr-3 mt-0.5">{iconMap[type]}</div>

        <div className="flex-grow">
          <p className={`text-sm font-medium ${colors.text}`}>{title}</p>
          {message && (
            <p className={`text-xs mt-1 ${colors.textSecondary}`}>{message}</p>
          )}
        </div>

        {onClose && (
          <button
            onClick={() => {
              setIsShowing(false);
              onClose();
            }}
            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationToast;
