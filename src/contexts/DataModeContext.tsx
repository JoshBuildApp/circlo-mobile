import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type DataMode = "real" | "demo";

interface DataModeContextType {
  dataMode: DataMode;
  setDataMode: (mode: DataMode) => void;
  isRealMode: boolean;
}

const DataModeContext = createContext<DataModeContextType>({
  dataMode: "real",
  setDataMode: () => {},
  isRealMode: true,
});

export const useDataMode = () => useContext(DataModeContext);

export const DataModeProvider = ({ children }: { children: ReactNode }) => {
  const [dataMode, setDataModeState] = useState<DataMode>(() => {
    // Forced preview builds (Capacitor/Xcode) always use real Supabase data
    // so previews don't accidentally render mocks.
    if (import.meta.env.VITE_V2_FORCE === "true") return "real";
    try {
      const stored = localStorage.getItem("circlo_data_mode");
      return stored === "demo" ? "demo" : "real";
    } catch {
      return "real";
    }
  });

  const setDataMode = useCallback((mode: DataMode) => {
    setDataModeState(mode);
    try {
      localStorage.setItem("circlo_data_mode", mode);
    } catch {}
  }, []);

  return (
    <DataModeContext.Provider value={{ dataMode, setDataMode, isRealMode: dataMode === "real" }}>
      {children}
    </DataModeContext.Provider>
  );
};
