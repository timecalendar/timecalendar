import 'package:freezed_annotation/freezed_annotation.dart';

part 'assistant_finished_result.freezed.dart';

@freezed
sealed class AssistantFinishedResult with _$AssistantFinishedResult {
  factory AssistantFinishedResult.fallback() = AssistantFinishedResultFallback;
  factory AssistantFinishedResult.done() = AssistantFinishedResultDone;
  AssistantFinishedResult._();
}
