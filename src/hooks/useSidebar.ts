import { useCallback, useState } from 'react';

const KEY = 'hb-sidebar-collapsed';

/** Persist sidebar collapsed state. Default: expanded on desktop. */
export function useSidebar() {
  const [collapsed, setCollapsed] = useState<boolean>(
    () => localStorage.getItem(KEY) === 'true',
  );

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(KEY, String(next));
      return next;
    });
  }, []);

  return { collapsed, toggle };
}
