import { formatRelativeTime, generateId } from '../../src/utils/helpers';

describe('formatRelativeTime', () => {
  it('should return "Just now" for very recent timestamps', () => {
    const now = Date.now();
    expect(formatRelativeTime(now)).toBe('Just now');
    expect(formatRelativeTime(now - 30000)).toBe('Just now'); // 30 seconds ago
  });

  it('should format minutes correctly', () => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');
  });

  it('should format hours correctly', () => {
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
  });

  it('should format days correctly', () => {
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
  });

  it('should format dates older than a week', () => {
    const tenDaysAgo = Date.now() - (10 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(tenDaysAgo);
    expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // matches date format
  });
});

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should generate IDs with timestamp and random parts', () => {
    const id = generateId();
    expect(id).toMatch(/^\d+_[a-z0-9]+$/);
  });

  it('should generate IDs with proper format', () => {
    const id = generateId();
    const parts = id.split('_');
    expect(parts).toHaveLength(2);
    expect(Number(parts[0])).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
  });
});
