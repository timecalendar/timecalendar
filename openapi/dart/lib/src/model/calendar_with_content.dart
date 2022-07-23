//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:timecalendar_api/src/model/calendar_event_for_public.dart';
import 'package:built_collection/built_collection.dart';
import 'package:timecalendar_api/src/model/calendar_for_public.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'calendar_with_content.g.dart';

/// CalendarWithContent
///
/// Properties:
/// * [calendar]
/// * [events]
abstract class CalendarWithContent
    implements Built<CalendarWithContent, CalendarWithContentBuilder> {
  @BuiltValueField(wireName: r'calendar')
  CalendarForPublic get calendar;

  @BuiltValueField(wireName: r'events')
  BuiltList<CalendarEventForPublic> get events;

  CalendarWithContent._();

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CalendarWithContentBuilder b) => b;

  factory CalendarWithContent([void updates(CalendarWithContentBuilder b)]) =
      _$CalendarWithContent;

  @BuiltValueSerializer(custom: true)
  static Serializer<CalendarWithContent> get serializer =>
      _$CalendarWithContentSerializer();
}

class _$CalendarWithContentSerializer
    implements StructuredSerializer<CalendarWithContent> {
  @override
  final Iterable<Type> types = const [
    CalendarWithContent,
    _$CalendarWithContent
  ];

  @override
  final String wireName = r'CalendarWithContent';

  @override
  Iterable<Object?> serialize(
      Serializers serializers, CalendarWithContent object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[];
    result
      ..add(r'calendar')
      ..add(serializers.serialize(object.calendar,
          specifiedType: const FullType(CalendarForPublic)));
    result
      ..add(r'events')
      ..add(serializers.serialize(object.events,
          specifiedType:
              const FullType(BuiltList, [FullType(CalendarEventForPublic)])));
    return result;
  }

  @override
  CalendarWithContent deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = CalendarWithContentBuilder();

    final iterator = serialized.iterator;
    while (iterator.moveNext()) {
      final key = iterator.current as String;
      iterator.moveNext();
      final Object? value = iterator.current;

      switch (key) {
        case r'calendar':
          final valueDes = serializers.deserialize(value,
                  specifiedType: const FullType(CalendarForPublic))
              as CalendarForPublic;
          result.calendar.replace(valueDes);
          break;
        case r'events':
          final valueDes = serializers.deserialize(value,
                  specifiedType: const FullType(
                      BuiltList, [FullType(CalendarEventForPublic)]))
              as BuiltList<CalendarEventForPublic>;
          result.events.replace(valueDes);
          break;
      }
    }
    return result.build();
  }
}
