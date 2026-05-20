import { createContext, useContext } from 'react';

export interface SettingsState {
  precision: number;
  zeroShift: number;
  sampleDisplacement: number;
  goniometerRadius: number;
  soundEnabled: boolean;
  animationsEnabled: boolean;
}

export const SettingsContext = createContext<SettingsState>({ 
  precision: 4,
  zeroShift: 0.0,
  sampleDisplacement: 0.0,
  goniometerRadius: 180.0,
  soundEnabled: false,
  animationsEnabled: true,
});

export const useSettings = () => useContext(SettingsContext);
