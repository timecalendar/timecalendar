import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';

part 'hidden_event.g.dart';

abstract class HiddenEvent implements Built<HiddenEvent, HiddenEventBuilder> {
  BuiltList<String> get uidHiddenEvents;
  BuiltList<String> get namedHiddenEvents;

  HiddenEvent._();
  factory HiddenEvent([updates(HiddenEventBuilder b)]) = _$HiddenEvent;

  factory HiddenEvent.fromMap(Map<String, dynamic> map) {
    return HiddenEvent(
      (hiddenEvent) => hiddenEvent
        ..uidHiddenEvents = ListBuilder<String>(map['uidHiddenEvents'])
        ..namedHiddenEvents = ListBuilder<String>(map['namedHiddenEvents']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'uidHiddenEvents': uidHiddenEvents.toList(),
      'namedHiddenEvents': namedHiddenEvents.toList(),
    };
  }
}
