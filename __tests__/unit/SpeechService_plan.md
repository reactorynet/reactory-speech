# Test Plan for SpeechService

## Test Scenarios
- [x] Scenario 1: SpeechService.synthesize delegates to provider
- [x] Scenario 2: SpeechService.transcribe delegates to provider
- [x] Scenario 3: SpeechService.getVoices delegates to provider
- [x] Scenario 4: SpeechService.getCapabilities returns disabled when no provider
- [x] Scenario 5: SpeechService.getCapabilities returns provider capabilities when ready
- [x] Scenario 6: SpeechService.ensureProvider throws when provider not ready
- [x] Scenario 7: SpeechService.getTTSStreamUrl returns correct WebSocket URL
- [x] Scenario 8: SpeechService.getSTTStreamUrl returns correct WebSocket URL

## Coverage Targets
- Target: 80% minimum
- Current: TBD

## Test Results
- [x] All tests passing (7/7)
- [ ] Coverage target met (TBD)
- [x] Plan updated with results
