import Reactory from '@reactory/reactory-core';
import { service } from '@reactory/server-core/application/decorators';
import type ReactorySpeech from '../types';

@service({
  id: 'speech.SpeechService@1.0.0',
  nameSpace: 'speech',
  name: 'SpeechService',
  version: '1.0.0',
  description: 'Speech service providing TTS and STT capabilities via a provider pattern',
  serviceType: 'integration',
  lifeCycle: 'singleton',
  dependencies: [],
})
export class SpeechService {
  public name = 'SpeechService';
  public nameSpace = 'speech';
  public version = '1.0.0';
  public description = 'Speech service providing TTS and STT capabilities';

  public context: Reactory.Server.IReactoryContext;
  public logger: Reactory.Service.ServiceLogger;
  public props: Reactory.Service.IReactoryServiceProps;

  private provider: ReactorySpeech.ISpeechProvider | null = null;

  constructor(
    props: Reactory.Service.IReactoryServiceProps,
    context: Reactory.Server.IReactoryContext,
  ) {
    this.props = props;
    this.context = context;
  }

  async onStartup(): Promise<void> {
    this.logger.debug('SpeechService starting up');

    const { LocalSpeechProvider } = await import('./providers/LocalSpeechProvider');
    const provider = new LocalSpeechProvider(this.context, this.logger);
    this.provider = provider;

    try {
      await provider.initialize();
      this.logger.info(`SpeechService: ${provider.name} provider initialized (ready=${provider.isReady})`);
    } catch (err: any) {
      this.logger.warn(`SpeechService: provider failed to initialize: ${err.message}`);
    }
  }

  private ensureProvider(): ReactorySpeech.ISpeechProvider {
    if (!this.provider || !this.provider.isReady) {
      throw new Error('Speech provider is not available. Ensure the speech microservice is running.');
    }
    return this.provider;
  }

  async synthesize(text: string, options?: ReactorySpeech.TTSOptions): Promise<ReactorySpeech.SpeechSynthesisResult> {
    return this.ensureProvider().synthesize(text, options);
  }

  async transcribe(audioBuffer: Buffer, options?: ReactorySpeech.STTOptions): Promise<ReactorySpeech.TranscriptionResult> {
    return this.ensureProvider().transcribe(audioBuffer, options);
  }

  async getVoices(): Promise<ReactorySpeech.Voice[]> {
    return this.ensureProvider().getVoices();
  }

  async getCapabilities(): Promise<ReactorySpeech.SpeechCapabilities> {
    if (!this.provider) {
      return { tts: false, stt: false, streaming: false, voices: [] };
    }
    return this.provider.getCapabilities();
  }

  getTTSStreamUrl(): string {
    const baseUrl = process.env.REACTORY_SPEECH_SERVICE_URL || 'http://localhost:8765';
    return baseUrl.replace(/^http/, 'ws') + '/api/tts/stream';
  }

  getSTTStreamUrl(): string {
    const baseUrl = process.env.REACTORY_SPEECH_SERVICE_URL || 'http://localhost:8765';
    return baseUrl.replace(/^http/, 'ws') + '/api/stt/stream';
  }
}

export default SpeechService;
