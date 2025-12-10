import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface GiftExchangeState {
  readonly result: Record<number, number> | undefined;
  readonly setResult: (result: Record<number, number>) => void;
}

const useGiftExchange = create<GiftExchangeState>()(
  persist(
    (set) => ({
      result: undefined,
      setResult: (result: Record<number, number>) => set({ result: result }),
    }),
    {
      name: "gift-exchange-storage",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

export default useGiftExchange;
