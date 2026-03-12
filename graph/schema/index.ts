import { loadGraphQLTypeDefinitions } from '@reactory/server-core/graph/graphql-loader';

const SpeechTypeDefinitions = loadGraphQLTypeDefinitions([
  'Speech/Types',
  'Speech/Inputs',
  'Speech/Queries',
  'Speech/Mutations',
], __dirname, 'Speech');

export default SpeechTypeDefinitions;
