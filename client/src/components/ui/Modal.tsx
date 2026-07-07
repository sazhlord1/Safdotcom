import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[400px] md:max-h-[80vh] z-50 rounded-2xl p-6 overflow-y-auto"
            style={{
              backgroundColor: "var(--tg-theme-bg-color)",
              color: "var(--tg-theme-text-color)",
            }}
          >
            {title && (
              <h3 className="text-lg font-bold mb-4">{title}</h3>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
