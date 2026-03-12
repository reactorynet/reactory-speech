# Test Plan for LocalSpeechProvider

## Test Scenarios
- [x] Scenario 1: initialize succeeds when health endpoint returns ok
- [x] Scenario 2: initialize handles unreachable service gracefully
- [x] Scenario 3: synthesize calls correct endpoint and returns result
- [x] Scenario 4: transcribe sends FormData with audio file
- [x] Scenario 5: getVoices returns voices from service
- [x] Scenario 6: getVoices falls back to default voices on error
- [x] Scenario 7: getCapabilities returns correct capabilities

## Coverage Targets
- Target: 80% minimum
- Current: TBD

## Test Results
- [x] All tests passing (8/8 — mock fixes for form-data applied, plus @reactory/reactory-core mock)
- [ ] Coverage target met (TBD)
- [x] Plan updated with results
