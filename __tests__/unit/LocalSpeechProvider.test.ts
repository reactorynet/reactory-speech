import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import axios from 'axios';

// Mock reactory-core
jest.mock('@reactory/reactory-core', () => ({}), { virtual: true });

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock form-data
const mockFormDataInstance = {
  append: jest.fn(),
  getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data; boundary=---' }),
};
jest.mock('form-data', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockFormDataInstance),
}));

import { LocalSpeechProvider } from '../../services/providers/LocalSpeechProvider';

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as any;

const mockContext = {
  log: jest.fn(),
} as any;

describe('LocalSpeechProvider', () => {
  let provider: LocalSpeechProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new LocalSpeechProvider(mockContext, mockLogger);
  });

  describe('initialize', () => {
    it('should set ready=true when health endpoint returns ok', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { status: 'ok' } } as any);

      await provider.initialize();

      expect(provider.isReady).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.objectContaining({ timeout: 5000 }),
      );
    });

    it('should set ready=false when service is unreachable', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await provider.initialize();

      expect(provider.isReady).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should set ready=false when health returns unexpected response', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { status: 'error' } } as any);

      await provider.initialize();

      expect(provider.isReady).toBe(false);
    });
  });

  describe('synthesize', () => {
    it('should call TTS endpoint and return audio result', async () => {
      const fakeAudio = Buffer.from('fake-wav-data');
      mockedAxios.post.mockResolvedValueOnce({
        data: fakeAudio,
        headers: {
          'x-audio-duration': '1.5',
          'x-sample-rate': '24000',
        },
      } as any);

      const result = await provider.synthesize('Hello world', { voice: 'af_heart', speed: 1.0 });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/tts/synthesize'),
        { text: 'Hello world', voice: 'af_heart', speed: 1.0 },
        expect.objectContaining({ responseType: 'arraybuffer' }),
      );
      expect(result.audioBuffer).toBeInstanceOf(Buffer);
      expect(result.format).toBe('wav');
      expect(result.duration).toBe(1.5);
      expect(result.sampleRate).toBe(24000);
    });
  });

  describe('transcribe', () => {
    it('should send audio as FormData and return transcription', async () => {
      const expectedResult = {
        text: 'Hello world',
        language: 'en',
        segments: [{ start: 0, end: 1.5, text: 'Hello world' }],
        duration: 1.5,
      };
      mockedAxios.post.mockResolvedValueOnce({ data: expectedResult } as any);

      const audioBuffer = Buffer.from('fake-audio');
      const result = await provider.transcribe(audioBuffer, { language: 'en' });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/stt/transcribe'),
        expect.anything(), // FormData instance
        expect.objectContaining({ timeout: 60000 }),
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getVoices', () => {
    it('should return voices from service', async () => {
      const voices = [{ id: 'af_heart', name: 'Heart', language: 'en-us' }];
      mockedAxios.get.mockResolvedValueOnce({ data: { voices } } as any);

      const result = await provider.getVoices();

      // First call may go to /api/tts/synthesize?action=voices, which is the primary endpoint
      expect(result).toEqual(voices);
    });

    it('should fall back to default voices on error', async () => {
      // Primary endpoint fails
      mockedAxios.get.mockResolvedValueOnce({ data: {} } as any);
      // Fallback /api/tts/voices also fails
      mockedAxios.get.mockRejectedValueOnce(new Error('not found'));

      const result = await provider.getVoices();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('language');
    });
  });

  describe('getCapabilities', () => {
    it('should return capabilities with voices', async () => {
      const voices = [{ id: 'af_heart', name: 'Heart', language: 'en-us' }];
      mockedAxios.get.mockResolvedValueOnce({ data: { voices } } as any);

      // Initialize first so isReady = true
      mockedAxios.get.mockResolvedValueOnce({ data: { status: 'ok' } } as any);
      // But initialize was already called, so force ready
      (provider as any).ready = true;

      // Re-mock for getVoices call inside getCapabilities
      mockedAxios.get.mockResolvedValueOnce({ data: { voices } } as any);

      const result = await provider.getCapabilities();

      expect(result.tts).toBe(true);
      expect(result.stt).toBe(true);
      expect(result.streaming).toBe(true);
    });
  });
});
