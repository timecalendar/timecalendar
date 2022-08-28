//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'calendar_event_custom_fields.g.dart';

/// CalendarEventCustomFields
///
/// Properties:
/// * [canceled]
/// * [shortDescription]
/// * [subject]
/// * [groupColor]
abstract class CalendarEventCustomFields
    implements
        Built<CalendarEventCustomFields, CalendarEventCustomFieldsBuilder> {
  @BuiltValueField(wireName: r'canceled')
  bool? get canceled;

  @BuiltValueField(wireName: r'shortDescription')
  String? get shortDescription;

  @BuiltValueField(wireName: r'subject')
  String? get subject;

  @BuiltValueField(wireName: r'groupColor')
  String? get groupColor;

  CalendarEventCustomFields._();

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CalendarEventCustomFieldsBuilder b) => b;

  factory CalendarEventCustomFields(
          [void updates(CalendarEventCustomFieldsBuilder b)]) =
      _$CalendarEventCustomFields;

  @BuiltValueSerializer(custom: true)
  static Serializer<CalendarEventCustomFields> get serializer =>
      _$CalendarEventCustomFieldsSerializer();
}

class _$CalendarEventCustomFieldsSerializer
    implements StructuredSerializer<CalendarEventCustomFields> {
  @override
  final Iterable<Type> types = const [
    CalendarEventCustomFields,
    _$CalendarEventCustomFields
  ];

  @override
  final String wireName = r'CalendarEventCustomFields';

  @override
  Iterable<Object?> serialize(
      Serializers serializers, CalendarEventCustomFields object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[];
    if (object.canceled != null) {
      result
        ..add(r'canceled')
        ..add(serializers.serialize(object.canceled,
            specifiedType: const FullType(bool)));
    }
    if (object.shortDescription != null) {
      result
        ..add(r'shortDescription')
        ..add(serializers.serialize(object.shortDescription,
            specifiedType: const FullType(String)));
    }
    if (object.subject != null) {
      result
        ..add(r'subject')
        ..add(serializers.serialize(object.subject,
            specifiedType: const FullType(String)));
    }
    if (object.groupColor != null) {
      result
        ..add(r'groupColor')
        ..add(serializers.serialize(object.groupColor,
            specifiedType: const FullType(String)));
    }
    return result;
  }

  @override
  CalendarEventCustomFields deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = CalendarEventCustomFieldsBuilder();

    final iterator = serialized.iterator;
    while (iterator.moveNext()) {
      final key = iterator.current as String;
      iterator.moveNext();
      final Object? value = iterator.current;

      switch (key) {
        case r'canceled':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(bool)) as bool;
          result.canceled = valueDes;
          break;
        case r'shortDescription':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.shortDescription = valueDes;
          break;
        case r'subject':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.subject = valueDes;
          break;
        case r'groupColor':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.groupColor = valueDes;
          break;
      }
    }
    return result.build();
  }
}
