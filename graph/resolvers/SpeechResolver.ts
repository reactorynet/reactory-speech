import Reactory from '@reactorynet/reactory-core';
import { roles } from '@reactory/server-core/authentication/decorators';
import { resolver, query, mutation } from '@reactory/server-core/models/graphql/decorators/resolver';

// @ts-ignore
@resolver
class SpeechResolver {
  resolver: any;

  @roles(['USER'], 'args.context')
  @query('SpeechVoices')
  async getVoices(
    obj: any,
    params: any,
    context: Reactory.Server.IReactoryContext,
  ): Promise<any[]> {
    const speechService = context.getService('speech.SpeechService@1.0.0') as any;
    return speechService.getVoices();
  }

  @roles(['USER'], 'args.context')
  @query('SpeechCapabilities')
  async getCapabilities(
    obj: any,
    params: any,
    context: Reactory.Server.IReactoryContext,
  ): Promise<any> {
    const speechService = context.getService('speech.SpeechService@1.0.0') as any;
    return speechService.getCapabilities();
  }

  @roles(['USER'], 'args.context')
  @query('SpeechStreamEndpoints')
  async getStreamEndpoints(
    obj: any,
    params: any,
    context: Reactory.Server.IReactoryContext,
  ): Promise<{ ttsStreamUrl: string; sttStreamUrl: string }> {
    const speechService = context.getService('speech.SpeechService@1.0.0') as any;
    return {
      ttsStreamUrl: speechService.getTTSStreamUrl(),
      sttStreamUrl: speechService.getSTTStreamUrl(),
    };
  }

  @roles(['USER'], 'args.context')
  @mutation('SpeechSynthesize')
  async synthesize(
    obj: any,
    args: { input: { text: string; voice?: string; speed?: number } },
    context: Reactory.Server.IReactoryContext,
  ): Promise<{ audioBase64: string; duration: number; format: string; sampleRate: number }> {
    const speechService = context.getService('speech.SpeechService@1.0.0') as any;
    const result = await speechService.synthesize(args.input.text, {
      voice: args.input.voice,
      speed: args.input.speed,
    });

    return {
      audioBase64: result.audioBuffer.toString('base64'),
      duration: result.duration,
      format: result.format,
      sampleRate: result.sampleRate,
    };
  }

  @roles(['USER'], 'args.context')
  @mutation('SpeechTranscribe')
  async transcribe(
    obj: any,
    args: { input: { audioBase64: string; language?: string } },
    context: Reactory.Server.IReactoryContext,
  ): Promise<any> {
    const speechService = context.getService('speech.SpeechService@1.0.0') as any;
    const audioBuffer = Buffer.from(args.input.audioBase64, 'base64');
    return speechService.transcribe(audioBuffer, { language: args.input.language });
  }
}

export default SpeechResolver;
