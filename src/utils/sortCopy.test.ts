import { describe, expect, it } from 'vitest';
import { sortCopy } from './sortCopy';

describe('sortCopy', () => {
  it('returns a new array and keeps equal values stable', () => {
    const source = [
      { key: 'b', order: 1 },
      { key: 'a', order: 2 },
      { key: 'a', order: 3 }
    ];

    const result = sortCopy(source, (left, right) => left.key.localeCompare(right.key));

    expect(result).toEqual([
      { key: 'a', order: 2 },
      { key: 'a', order: 3 },
      { key: 'b', order: 1 }
    ]);
    expect(result).not.toBe(source);
    expect(source[0].key).toBe('b');
  });

  it('handles empty and single-item inputs', () => {
    expect(sortCopy([], () => 0)).toEqual([]);
    const item = { value: 1 };
    expect(sortCopy([item], () => 0)).toEqual([item]);
  });
});
