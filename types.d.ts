import Reactory from '@reactorynet/reactory-core';

/**
 * Speech module types for TTS and STT services.
 */
declare namespace ReactorySpeech {

  interface TTSOptions {
    voice?: string;
    speed?: number;
  }

  interface STTOptions {
    language?: string;
  }

  interface Voice {
    id: string;
    name: string;
    language: string;
  }

  interface TranscriptionSegment {
    start: number;
    end: number;
    text: string;
  }

  interface TranscriptionResult {
    text: string;
    language: string;
    segments: TranscriptionSegment[];
    duration: number;
  }

  interface SpeechSynthesisResult {
    audioBuffer: Buffer;
    duration: number;
    format: string;
    sampleRate: number;
  }

  interface SpeechCapabilities {
    tts: boolean;
    stt: boolean;
    streaming: boolean;
    voices: Voice[];
  }

  /**
   * Provider interface — implemented by LocalSpeechProvider, future cloud providers, etc.
   */
  interface ISpeechProvider {
    readonly name: string;
    readonly isReady: boolean;

    initialize(): Promise<void>;

    synthesize(text: string, options?: TTSOptions): Promise<SpeechSynthesisResult>;
    transcribe(audioBuffer: Buffer, options?: STTOptions): Promise<TranscriptionResult>;
    getVoices(): Promise<Voice[]>;
    getCapabilities(): Promise<SpeechCapabilities>;
  }

  /**
   * Main SpeechService interface exposed to other modules via context.getService().
   */
  interface ISpeechService extends Reactory.Service.IReactoryDefaultService {
    synthesize(text: string, options?: TTSOptions): Promise<SpeechSynthesisResult>;
    transcribe(audioBuffer: Buffer, options?: STTOptions): Promise<TranscriptionResult>;
    getVoices(): Promise<Voice[]>;
    getCapabilities(): Promise<SpeechCapabilities>;
    getTTSStreamUrl(): string;
    getSTTStreamUrl(): string;
  }
}

export default ReactorySpeech;
