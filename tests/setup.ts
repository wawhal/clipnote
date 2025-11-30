import '@testing-library/jest-dom';

// Mock chrome APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    },
    getURL: jest.fn((path) => `chrome-extension://fake-id/${path}`)
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    captureVisibleTab: jest.fn()
  },
  commands: {
    onCommand: {
      addListener: jest.fn()
    }
  },
  scripting: {
    executeScript: jest.fn()
  },
  notifications: {
    create: jest.fn()
  },
  offscreen: {
    createDocument: jest.fn()
  }
} as any;
