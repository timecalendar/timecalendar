//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
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
@BuiltValue()
abstract class CalendarWithContent
    implements Built<CalendarWithContent, CalendarWithContentBuilder> {
  @BuiltValueField(wireName: r'calendar')
  CalendarForPublic get calendar;

  @BuiltValueField(wireName: r'events')
  BuiltList<CalendarEventForPublic> get events;

  CalendarWithContent._();

  factory CalendarWithContent([void updates(CalendarWithContentBuilder b)]) =
      _$CalendarWithContent;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CalendarWithContentBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CalendarWithContent> get serializer =>
      _$CalendarWithContentSerializer();
}

class _$CalendarWithContentSerializer
    implements PrimitiveSerializer<CalendarWithContent> {
  @override
  final Iterable<Type> types = const [
    CalendarWithContent,
    _$CalendarWithContent
  ];

  @override
  final String wireName = r'CalendarWithContent';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CalendarWithContent object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'calendar';
    yield serializers.serialize(
      object.calendar,
      specifiedType: const FullType(CalendarForPublic),
    );
    yield r'events';
    yield serializers.serialize(
      object.events,
      specifiedType:
          const FullType(BuiltList, [FullType(CalendarEventForPublic)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CalendarWithContent object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object,
            specifiedType: specifiedType)
        .toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CalendarWithContentBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'calendar':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CalendarForPublic),
          ) as CalendarForPublic;
          result.calendar.replace(valueDes);
          break;
        case r'events':
          final valueDes = serializers.deserialize(
            value,
            specifiedType:
                const FullType(BuiltList, [FullType(CalendarEventForPublic)]),
          ) as BuiltList<CalendarEventForPublic>;
          result.events.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CalendarWithContent deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CalendarWithContentBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}
