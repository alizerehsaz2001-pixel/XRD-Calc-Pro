import { createContext, useContext } from 'react';

export const SettingsContext = createContext<{ precision: number }>({ precision: 4 });

export const useSettings = () => useContext(SettingsContext);
