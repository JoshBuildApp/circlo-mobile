import { toast } from "sonner";

// Branded toast styles
const toastStyles = {
  success: {
    style: {
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "500",
    },
  },
  error: {
    style: {
      background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "500",
    },
  },
  info: {
    style: {
      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "500",
    },
  },
  loading: {
    style: {
      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "500",
    },
  },
};

export const showBookingToast = {
  success: (message: string) => {
    toast.success(message, toastStyles.success);
  },
  error: (message: string) => {
    toast.error(message, toastStyles.error);
  },
  info: (message: string) => {
    toast.info(message, toastStyles.info);
  },
  loading: (message: string) => {
    return toast.loading(message, toastStyles.loading);
  },
};