import { vi } from 'vitest';

// Mock console methods during tests to reduce noise
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  // Keep log and info for debugging
  log: console.log,
  info: console.info,
  debug: vi.fn(),
  trace: vi.fn()
};

// Set test timezone
process.env.TZ = 'Asia/Dhaka';

// Mock Date for consistent testing
const mockDate = new Date('2024-01-15T10:00:00.000Z');
vi.setSystemTime(mockDate);

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});