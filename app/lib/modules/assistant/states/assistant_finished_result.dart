import 'package:freezed_annotation/freezed_annotation.dart';

part 'assistant_finished_result.freezed.dart';

@freezed
class AssistantFinishedResult with _$AssistantFinishedResult {
  factory AssistantFinishedResult.fallback() = _AssistantFinishedResultFallback;
  factory AssistantFinishedResult.done({
    required String token,
  }) = _AssistantFinishedResultDone;
  AssistantFinishedResult._();
}
