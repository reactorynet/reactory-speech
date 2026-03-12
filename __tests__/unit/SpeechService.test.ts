import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock reactory-core
jest.mock('@reactory/reactory-core', () => ({}), { virtual: true });

// Mock the @service decorator — it's a no-op in tests
jest.mock('@reactory/server-core/application/decorators', () => ({
  service: () => (target: any) => target,
}));

// Mock axios before importing LocalSpeechProvider
jest.mock('axios');

// Mock the dynamic import of LocalSpeechProvider
const mockProvider = {
  name: 'MockSpeechProvider',
  isReady: true,
  initialize: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  synthesize: jest.fn<(...args: any[]) => Promise<any>>(),
  transcribe: jest.fn<(...args: any[]) => Promise<any>>(),
  getVoices: jest.fn<() => Promise<any[]>>(),
  getCapabilities: jest.fn<() => Promise<any>>(),
};

jest.mock('../../services/providers/LocalSpeechProvider', () => ({
  LocalSpeechProvider: jest.fn().mockImplementation(() => mockProvider),
}));

import { SpeechService } from '../../services/SpeechService';

const mockContext = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  getService: jest.fn(),
} as any;

const mockProps = {} as any;

describe('SpeechService', () => {
  let service: SpeechService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockProvider.isReady = true;
    mockProvider.initialize.mockResolvedValue(undefined);

    service = new SpeechService(mockProps, mockContext);
    // Manually assign logger since it's set by the decorator framework
    (service as any).logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    await service.onStartup();
  });

  describe('synthesize', () => {
    it('should delegate to provider', async () => {
      const expectedResult = {
        audioBuffer: Buffer.from('test-audio'),
        duration: 1.5,
        format: 'wav',
        sampleRate: 24000,
      };
      mockProvider.synthesize.mockResolvedValue(expectedResult);

      const result = await service.synthesize('Hello world', { voice: 'af_heart', speed: 1.0 });

      expect(mockProvider.synthesize).toHaveBeenCalledWith('Hello world', { voice: 'af_heart', speed: 1.0 });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('transcribe', () => {
    it('should delegate to provider', async () => {
      const expectedResult = {
        text: 'Hello world',
        language: 'en',
        segments: [{ start: 0, end: 1.5, text: 'Hello world' }],
        duration: 1.5,
      };
      mockProvider.transcribe.mockResolvedValue(expectedResult);

      const audioBuffer = Buffer.from('test-audio');
      const result = await service.transcribe(audioBuffer, { language: 'en' });

      expect(mockProvider.transcribe).toHaveBeenCalledWith(audioBuffer, { language: 'en' });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getVoices', () => {
    it('should delegate to provider', async () => {
      const voices = [
        { id: 'af_heart', name: 'Heart', language: 'en-us' },
        { id: 'am_adam', name: 'Adam', language: 'en-us' },
      ];
      mockProvider.getVoices.mockResolvedValue(voices);

      const result = await service.getVoices();

      expect(mockProvider.getVoices).toHaveBeenCalled();
      expect(result).toEqual(voices);
    });
  });

  describe('getCapabilities', () => {
    it('should return disabled capabilities when provider is null', async () => {
      // Create service without calling onStartup (no provider)
      const freshService = new SpeechService(mockProps, mockContext);
      (freshService as any).logger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };

      const result = await freshService.getCapabilities();

      expect(result).toEqual({
        tts: false,
        stt: false,
        streaming: false,
        voices: [],
      });
    });

    it('should return provider capabilities when ready', async () => {
      const capabilities = {
        tts: true,
        stt: true,
        streaming: true,
        voices: [{ id: 'af_heart', name: 'Heart', language: 'en-us' }],
      };
      mockProvider.getCapabilities.mockResolvedValue(capabilities);

      const result = await service.getCapabilities();

      expect(result).toEqual(capabilities);
    });
  });

  describe('ensureProvider', () => {
    it('should throw when provider is not ready', async () => {
      mockProvider.isReady = false;

      await expect(service.synthesize('test')).rejects.toThrow(
        'Speech provider is not available'
      );
    });
  });

  describe('stream URLs', () => {
    it('should return correct TTS WebSocket URL', () => {
      const originalEnv = process.env.REACTORY_SPEECH_SERVICE_URL;
      process.env.REACTORY_SPEECH_SERVICE_URL = 'http://speech:8765';

      const url = service.getTTSStreamUrl();
      expect(url).toBe('ws://speech:8765/api/tts/stream');

      process.env.REACTORY_SPEECH_SERVICE_URL = originalEnv;
    });

    it('should return correct STT WebSocket URL', () => {
      const originalEnv = process.env.REACTORY_SPEECH_SERVICE_URL;
      process.env.REACTORY_SPEECH_SERVICE_URL = 'https://speech.example.com';

      const url = service.getSTTStreamUrl();
      expect(url).toBe('wss://speech.example.com/api/stt/stream');

      process.env.REACTORY_SPEECH_SERVICE_URL = originalEnv;
    });

    it('should use default URL when env var not set', () => {
      const originalEnv = process.env.REACTORY_SPEECH_SERVICE_URL;
      delete process.env.REACTORY_SPEECH_SERVICE_URL;

      const url = service.getTTSStreamUrl();
      expect(url).toBe('ws://localhost:8765/api/tts/stream');

      process.env.REACTORY_SPEECH_SERVICE_URL = originalEnv;
    });
  });
});
