import SpeechResolver from './SpeechResolver';
import { mergeGraphResolver } from '@reactory/server-core/utils';

export default mergeGraphResolver([
  SpeechResolver,
]);
