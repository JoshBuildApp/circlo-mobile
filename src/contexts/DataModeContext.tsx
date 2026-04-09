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
