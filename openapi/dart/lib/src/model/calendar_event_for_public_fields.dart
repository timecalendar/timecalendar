//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'calendar_event_for_public_fields.g.dart';

/// CalendarEventForPublicFields
///
/// Properties:
/// * [canceled]
/// * [shortDescription]
/// * [subject]
/// * [groupColor]
abstract class CalendarEventForPublicFields
    implements
        Built<CalendarEventForPublicFields,
            CalendarEventForPublicFieldsBuilder> {
  @BuiltValueField(wireName: r'canceled')
  bool? get canceled;

  @BuiltValueField(wireName: r'shortDescription')
  String? get shortDescription;

  @BuiltValueField(wireName: r'subject')
  String? get subject;

  @BuiltValueField(wireName: r'groupColor')
  String? get groupColor;

  CalendarEventForPublicFields._();

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CalendarEventForPublicFieldsBuilder b) => b;

  factory CalendarEventForPublicFields(
          [void updates(CalendarEventForPublicFieldsBuilder b)]) =
      _$CalendarEventForPublicFields;

  @BuiltValueSerializer(custom: true)
  static Serializer<CalendarEventForPublicFields> get serializer =>
      _$CalendarEventForPublicFieldsSerializer();
}

class _$CalendarEventForPublicFieldsSerializer
    implements StructuredSerializer<CalendarEventForPublicFields> {
  @override
  final Iterable<Type> types = const [
    CalendarEventForPublicFields,
    _$CalendarEventForPublicFields
  ];

  @override
  final String wireName = r'CalendarEventForPublicFields';

  @override
  Iterable<Object?> serialize(
      Serializers serializers, CalendarEventForPublicFields object,
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
  CalendarEventForPublicFields deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = CalendarEventForPublicFieldsBuilder();

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
