import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:timecalendar/modules/activity/models/calendar_log_event.dart';

part 'calendar_change.freezed.dart';
part 'calendar_change.g.dart';

@freezed
abstract class CalendarChange with _$CalendarChange {
  const factory CalendarChange({
    required List<CalendarLogEvent> oldItems,
    required List<CalendarLogEvent> newItems,
    required List<CalendarEventChange> changedItems,
  }) = _CalendarChange;

  factory CalendarChange.fromJson(Map<String, dynamic> json) =>
      _$CalendarChangeFromJson(json);

  factory CalendarChange.fromInternalDb(Map<String, dynamic> map) {
    return CalendarChange(
      oldItems: List<Map<String, dynamic>>.from(
        map['oldItems'],
      ).map((event) => CalendarLogEvent.fromInternalDb(event)).toList(),
      newItems: List<Map<String, dynamic>>.from(
        map['newItems'],
      ).map((event) => CalendarLogEvent.fromInternalDb(event)).toList(),
      changedItems: List<List<dynamic>>.from(map['changedItems'])
          .map(
            (eventPair) => CalendarEventChange(
              oldEvent: CalendarLogEvent.fromInternalDb(eventPair[0]),
              newEvent: CalendarLogEvent.fromInternalDb(eventPair[1]),
            ),
          )
          .toList(),
    );
  }
}

@freezed
abstract class CalendarEventChange with _$CalendarEventChange {
  const factory CalendarEventChange({
    required CalendarLogEvent oldEvent,
    required CalendarLogEvent newEvent,
  }) = _CalendarEventChange;

  factory CalendarEventChange.fromJson(Map<String, dynamic> json) =>
      _$CalendarEventChangeFromJson(json);
}

extension CalendarChangeExtension on CalendarChange {
  Map<String, dynamic> toDbMap() {
    return {
      'oldItems': oldItems.map((event) => event.toDbMap()).toList(),
      'newItems': newItems.map((event) => event.toDbMap()).toList(),
      'changedItems': changedItems
          .map(
            (change) => [change.oldEvent.toDbMap(), change.newEvent.toDbMap()],
          )
          .toList(),
    };
  }
}
