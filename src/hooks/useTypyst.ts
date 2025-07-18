import { useState, useEffect } from "react";

// Global cache to avoid re-loading
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let $typst: any = null;
let isLoading = false;

export function useTypst() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initTypst = async () => {
      // If already loaded, just mark as ready
      if ($typst) {
        setIsReady(true);
        return;
      }

      // If already loading, wait for it
      if (isLoading) {
        const checkReady = setInterval(() => {
          if ($typst) {
            setIsReady(true);
            clearInterval(checkReady);
          }
        }, 100);
        return;
      }

      try {
        isLoading = true;
        console.log("🔧 Loading Typst...");

        // Dynamic import - only on client side
        const typstModule = await import("@myriaddreamin/typst-all-in-one.ts");
        $typst = typstModule.$typst;

        // Wait for WebAssembly to initialize
        if ($typst.ready) {
          await $typst.ready;
        }

        setIsReady(true);
        console.log("✅ Typst ready!");
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        console.error("❌ Typst failed to load:", errorMsg);
      } finally {
        isLoading = false;
      }
    };

    initTypst();
  }, []);

  return {
    $typst,
    isReady,
    error,
  };
}
