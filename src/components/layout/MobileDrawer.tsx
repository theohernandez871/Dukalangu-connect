import { AnimatePresence, motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { SidebarNav } from './SidebarNav';
import { BrandMark } from './BrandMark';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="absolute left-0 top-0 h-full w-72 border-r border-slate-200 bg-white py-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-6 flex items-center justify-between px-5">
              <BrandMark />
              <button
                type="button"
                onClick={onClose}
                aria-label="Funga menyu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 focus-ring dark:hover:bg-slate-800"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav onNavigate={onClose} />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
