import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '@/lib/safe-storage';

interface AppearanceState {
  appName: string;
  showLogoIcon: boolean;
  
  setAppName: (name: string) => void;
  setShowLogoIcon: (show: boolean) => void;
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      appName: 'Финансы',
      showLogoIcon: true,
      
      setAppName: (name) => set({ appName: name }),
      setShowLogoIcon: (show) => set({ showLogoIcon: show }),
    }),
    {
      name: 'appearance-storage',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);

