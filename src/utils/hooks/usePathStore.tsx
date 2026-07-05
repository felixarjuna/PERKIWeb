import { useRouter } from "next/router";
import React from "react";
import { create } from "zustand";

interface AsPathStoreType {
  readonly prevAsPath: string | undefined;
  readonly currentAsPath: string | undefined;
}

const asPathStore = create<AsPathStoreType>(() => ({
  prevAsPath: undefined,
  currentAsPath: undefined,
}));

/** use as a hook to get prevAsPath and currentAsPath- */
export const useAsPath = () => asPathStore((state) => state);

/** use everywhere you like */
export const getAsPath = () => asPathStore.getState();

/** only use this in _app.tsx or root. it's like an provider. */
export const useAsPathInitializer = () => {
  const { asPath } = useRouter();
  const { currentAsPath } = useAsPath();

  React.useEffect(() => {
    if (currentAsPath !== asPath) {
      asPathStore.setState((state) => ({
        ...state,
        currentAsPath: asPath,
        prevAsPath: currentAsPath,
      }));
    }
  }, [asPath, currentAsPath]);
};
