import { motion, AnimatePresence } from "framer-motion";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  const bgColor =
    type === "success"
      ? "bg-emerald-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-tg-button";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 ${bgColor} text-white px-6 py-3 rounded-xl shadow-lg max-w-[90vw]`}
        onClick={onClose}
      >
        <p className="text-sm font-medium text-center">{message}</p>
      </motion.div>
    </AnimatePresence>
  );
}
