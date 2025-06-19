
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock window.location.origin with custom domain
Object.defineProperty(window, 'location', {
  value: {
    origin: 'https://fin.dartnox.com'
  },
  writable: true
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn()
};

// Mock crypto.randomUUID for tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
  }
});
