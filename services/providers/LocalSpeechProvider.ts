import axios from 'axios';
import Reactory from '@reactorynet/reactory-core';
import type ReactorySpeech from '../../types';

const SPEECH_SERVICE_URL = process.env.REACTORY_SPEECH_SERVICE_URL || 'http://localhost:8765';

/**
 * LocalSpeechProvider communicates with the Python FastAPI speech microservice
 * over HTTP REST (and WebSocket for streaming handled at route level).
 */
export class LocalSpeechProvider implements ReactorySpeech.ISpeechProvider {
  readonly name = 'LocalSpeechProvider';
  private ready = false;
  private context: Reactory.Server.IReactoryContext;
  private logger: Reactory.Service.ServiceLogger;

  get isReady(): boolean {
    return this.ready;
  }

  constructor(context: Reactory.Server.IReactoryContext, logger: Reactory.Service.ServiceLogger) {
    this.context = context;
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    try {
      const response = await axios.get(`${SPEECH_SERVICE_URL}/health`, { timeout: 5000 });
      if (response.data?.status === 'ok') {
        this.ready = true;
        this.logger.info(`LocalSpeechProvider connected to speech service at ${SPEECH_SERVICE_URL}`);
      } else {
        this.logger.warn(`LocalSpeechProvider: unexpected health response: ${JSON.stringify(response.data)}`);
      }
    } catch (err: any) {
      this.logger.warn(`LocalSpeechProvider: speech service unreachable at ${SPEECH_SERVICE_URL}: ${err.message}`);
      this.ready = false;
    }
  }

  async synthesize(text: string, options?: ReactorySpeech.TTSOptions): Promise<ReactorySpeech.SpeechSynthesisResult> {
    const response = await axios.post(
      `${SPEECH_SERVICE_URL}/api/tts/synthesize`,
      {
        text,
        voice: options?.voice || 'af_heart',
        speed: options?.speed || 1.0,
      },
      {
        responseType: 'arraybuffer',
        timeout: 30000,
      },
    );

    const audioBuffer = Buffer.from(response.data);
    const duration = parseFloat(response.headers['x-audio-duration'] || '0');
    const sampleRate = parseInt(response.headers['x-sample-rate'] || '24000', 10);

    return {
      audioBuffer,
      duration,
      format: 'wav',
      sampleRate,
    };
  }

  async transcribe(audioBuffer: Buffer, options?: ReactorySpeech.STTOptions): Promise<ReactorySpeech.TranscriptionResult> {
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: 'audio.wav',
      contentType: 'audio/wav',
    });
    if (options?.language) {
      formData.append('language', options.language);
    }

    const response = await axios.post(
      `${SPEECH_SERVICE_URL}/api/stt/transcribe`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 60000,
      },
    );

    return response.data as ReactorySpeech.TranscriptionResult;
  }

  async getVoices(): Promise<ReactorySpeech.Voice[]> {
    const response = await axios.get(`${SPEECH_SERVICE_URL}/api/tts/synthesize`, {
      params: { action: 'voices' },
      timeout: 5000,
    });

    // The Python service returns voices on the TTS endpoint or a separate voices endpoint
    // Falling back to a hardcoded list that matches Kokoro's voice pack
    if (response.data?.voices) {
      return response.data.voices;
    }

    // Fallback: fetch from json endpoint
    try {
      const voicesResp = await axios.get(`${SPEECH_SERVICE_URL}/api/tts/voices`, { timeout: 5000 });
      return voicesResp.data?.voices || [];
    } catch {
      return this.getDefaultVoices();
    }
  }

  async getCapabilities(): Promise<ReactorySpeech.SpeechCapabilities> {
    const voices = await this.getVoices();
    return {
      tts: this.ready,
      stt: this.ready,
      streaming: true,
      voices,
    };
  }

  private getDefaultVoices(): ReactorySpeech.Voice[] {
    return [
      { id: 'af_heart', name: 'Heart (American Female)', language: 'en-us' },
      { id: 'af_alloy', name: 'Alloy (American Female)', language: 'en-us' },
      { id: 'af_aoede', name: 'Aoede (American Female)', language: 'en-us' },
      { id: 'af_bella', name: 'Bella (American Female)', language: 'en-us' },
      { id: 'af_jessica', name: 'Jessica (American Female)', language: 'en-us' },
      { id: 'af_kore', name: 'Kore (American Female)', language: 'en-us' },
      { id: 'af_nicole', name: 'Nicole (American Female)', language: 'en-us' },
      { id: 'af_nova', name: 'Nova (American Female)', language: 'en-us' },
      { id: 'af_river', name: 'River (American Female)', language: 'en-us' },
      { id: 'af_sarah', name: 'Sarah (American Female)', language: 'en-us' },
      { id: 'af_sky', name: 'Sky (American Female)', language: 'en-us' },
      { id: 'am_adam', name: 'Adam (American Male)', language: 'en-us' },
      { id: 'am_echo', name: 'Echo (American Male)', language: 'en-us' },
      { id: 'am_eric', name: 'Eric (American Male)', language: 'en-us' },
      { id: 'am_liam', name: 'Liam (American Male)', language: 'en-us' },
      { id: 'am_michael', name: 'Michael (American Male)', language: 'en-us' },
      { id: 'am_onyx', name: 'Onyx (American Male)', language: 'en-us' },
      { id: 'bf_emma', name: 'Emma (British Female)', language: 'en-gb' },
      { id: 'bf_isabella', name: 'Isabella (British Female)', language: 'en-gb' },
      { id: 'bm_daniel', name: 'Daniel (British Male)', language: 'en-gb' },
      { id: 'bm_fable', name: 'Fable (British Male)', language: 'en-gb' },
      { id: 'bm_george', name: 'George (British Male)', language: 'en-gb' },
      { id: 'bm_lewis', name: 'Lewis (British Male)', language: 'en-gb' },
    ];
  }
}

export default LocalSpeechProvider;
