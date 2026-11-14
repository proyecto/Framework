import { describe, expect, it } from 'vitest';
import {
  calculateAdjustedCardPrice,
  DEFAULT_CONDITION_MULTIPLIERS,
  getConditionMultiplier,
  normalizeCardCondition
} from './conditionMultipliers.js';

describe('MintMox Condition Multipliers domain logic', () => {
  it('normalizes various condition string formats to canonical codes', () => {
    expect(normalizeCardCondition('NM')).toBe('NM');
    expect(normalizeCardCondition('near mint')).toBe('NM');
    expect(normalizeCardCondition('M')).toBe('NM');
    expect(normalizeCardCondition('EX')).toBe('EX');
    expect(normalizeCardCondition('excellent')).toBe('EX');
    expect(normalizeCardCondition('GD')).toBe('GD');
    expect(normalizeCardCondition('good')).toBe('GD');
    expect(normalizeCardCondition('VG')).toBe('GD');
    expect(normalizeCardCondition('LP')).toBe('LP');
    expect(normalizeCardCondition('lightly played')).toBe('LP');
    expect(normalizeCardCondition('SP')).toBe('LP');
    expect(normalizeCardCondition('PL')).toBe('PL');
    expect(normalizeCardCondition('played')).toBe('PL');
    expect(normalizeCardCondition('MP')).toBe('PL');
    expect(normalizeCardCondition('PO')).toBe('PO');
    expect(normalizeCardCondition('poor')).toBe('PO');
    expect(normalizeCardCondition('DMG')).toBe('PO');
    expect(normalizeCardCondition('damaged')).toBe('PO');
    expect(normalizeCardCondition(null)).toBe('NM');
    expect(normalizeCardCondition(undefined)).toBe('NM');
    expect(normalizeCardCondition('unknown')).toBe('NM');
  });

  it('provides default multipliers matching standard industry values', () => {
    expect(getConditionMultiplier('NM')).toBe(1.0);
    expect(getConditionMultiplier('EX')).toBe(0.9);
    expect(getConditionMultiplier('GD')).toBe(0.85);
    expect(getConditionMultiplier('LP')).toBe(0.8);
    expect(getConditionMultiplier('PL')).toBe(0.65);
    expect(getConditionMultiplier('PO')).toBe(0.4);
  });

  it('respects user-customized multipliers when provided', () => {
    const custom = {
      ...DEFAULT_CONDITION_MULTIPLIERS,
      LP: 0.75,
      PO: 0.25
    };

    expect(getConditionMultiplier('LP', custom)).toBe(0.75);
    expect(getConditionMultiplier('PO', custom)).toBe(0.25);
    expect(getConditionMultiplier('NM', custom)).toBe(1.0);
  });

  it('calculates adjusted price correctly with default multipliers', () => {
    const base = 100.0;
    expect(calculateAdjustedCardPrice(base, 'NM')).toBe(100.0);
    expect(calculateAdjustedCardPrice(base, 'EX')).toBe(90.0);
    expect(calculateAdjustedCardPrice(base, 'GD')).toBe(85.0);
    expect(calculateAdjustedCardPrice(base, 'LP')).toBe(80.0);
    expect(calculateAdjustedCardPrice(base, 'PL')).toBe(65.0);
    expect(calculateAdjustedCardPrice(base, 'PO')).toBe(40.0);
  });

  it('returns raw base price when enabled is false', () => {
    const base = 285.5;
    expect(calculateAdjustedCardPrice(base, 'PO', undefined, false)).toBe(285.5);
    expect(calculateAdjustedCardPrice(base, 'PL', undefined, false)).toBe(285.5);
  });

  it('handles fractional cents and edge cases cleanly', () => {
    // 285.50 * 0.65 (PL) = 185.575 -> 185.58
    expect(calculateAdjustedCardPrice(285.5, 'PL')).toBe(185.58);
    // 45.00 * 0.80 (LP) = 36.00
    expect(calculateAdjustedCardPrice(45.0, 'LP')).toBe(36.0);
    // 0 or negative price
    expect(calculateAdjustedCardPrice(0, 'PL')).toBe(0);
    expect(calculateAdjustedCardPrice(-10, 'PL')).toBe(0);
  });
});

