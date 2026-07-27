import { createContext, useContext } from 'react';

export type LengthUnit = 'Å' | 'nm' | 'pm';

export interface SettingsState {
  precision: number;
  zeroShift: number;
  sampleDisplacement: number;
  goniometerRadius: number;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  lengthUnit: LengthUnit;
  setLengthUnit?: (unit: LengthUnit) => void;
}

export const SettingsContext = createContext<SettingsState>({ 
  precision: 4,
  zeroShift: 0.0,
  sampleDisplacement: 0.0,
  goniometerRadius: 180.0,
  soundEnabled: false,
  animationsEnabled: true,
  lengthUnit: 'Å',
  setLengthUnit: () => {},
});

export const useSettings = () => useContext(SettingsContext);

/**
 * Converts length from internal base unit (Ångström) to the selected display length unit.
 */
export const convertLength = (valueInAngstroms: number, unit: LengthUnit = 'Å'): number => {
  if (valueInAngstroms === undefined || valueInAngstroms === null || isNaN(valueInAngstroms)) return 0;
  switch (unit) {
    case 'nm':
      return valueInAngstroms * 0.1;
    case 'pm':
      return valueInAngstroms * 100;
    case 'Å':
    default:
      return valueInAngstroms;
  }
};

/**
 * Converts length from the given length unit back to internal base unit (Ångström).
 */
export const convertToAngstrom = (valueInUnit: number, unit: LengthUnit = 'Å'): number => {
  if (valueInUnit === undefined || valueInUnit === null || isNaN(valueInUnit)) return 0;
  switch (unit) {
    case 'nm':
      return valueInUnit * 10;
    case 'pm':
      return valueInUnit * 0.01;
    case 'Å':
    default:
      return valueInUnit;
  }
};

/**
 * Formats a value in Ångströms to a localized formatted string with unit symbol.
 */
export const formatLength = (valueInAngstroms: number, unit: LengthUnit = 'Å', precision: number = 4): string => {
  const converted = convertLength(valueInAngstroms, unit);
  return `${converted.toFixed(precision)} ${unit}`;
};

