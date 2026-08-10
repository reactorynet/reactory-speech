import Reactory from '@reactorynet/reactory-core';
import routes from './routes';
import services from './services';
import SpeechTypeDefinitions from './graph/schema';
import SpeechResolvers from './graph/resolvers';

const ReactorySpeech: Reactory.Server.IReactoryModule = {
  id: 'reactory-speech',
  nameSpace: 'speech',
  name: 'Speech',
  version: '1.0.0',
  description: 'Reactory Speech Module. Provides TTS and STT services via a local Python microservice with Kokoro and Whisper.',
  dependencies: [
    'core.ReactoryServer@1.0.0',
  ],
  priority: 5,
  graphDefinitions: {
    Types: SpeechTypeDefinitions,
    Resolvers: SpeechResolvers,
    Directives: [],
  },
  workflows: [],
  forms: [],
  services,
  translations: [],
  models: [],
  clientPlugins: [],
  pdfs: [],
  passportProviders: [],
  grpc: [],
  routes,
  cli: [],
};

export default ReactorySpeech;
