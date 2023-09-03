//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
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
@BuiltValue()
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

  factory CalendarEventCustomFields(
          [void updates(CalendarEventCustomFieldsBuilder b)]) =
      _$CalendarEventCustomFields;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CalendarEventCustomFieldsBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CalendarEventCustomFields> get serializer =>
      _$CalendarEventCustomFieldsSerializer();
}

class _$CalendarEventCustomFieldsSerializer
    implements PrimitiveSerializer<CalendarEventCustomFields> {
  @override
  final Iterable<Type> types = const [
    CalendarEventCustomFields,
    _$CalendarEventCustomFields
  ];

  @override
  final String wireName = r'CalendarEventCustomFields';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CalendarEventCustomFields object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.canceled != null) {
      yield r'canceled';
      yield serializers.serialize(
        object.canceled,
        specifiedType: const FullType(bool),
      );
    }
    if (object.shortDescription != null) {
      yield r'shortDescription';
      yield serializers.serialize(
        object.shortDescription,
        specifiedType: const FullType(String),
      );
    }
    if (object.subject != null) {
      yield r'subject';
      yield serializers.serialize(
        object.subject,
        specifiedType: const FullType(String),
      );
    }
    if (object.groupColor != null) {
      yield r'groupColor';
      yield serializers.serialize(
        object.groupColor,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CalendarEventCustomFields object, {
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
    required CalendarEventCustomFieldsBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'canceled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.canceled = valueDes;
          break;
        case r'shortDescription':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.shortDescription = valueDes;
          break;
        case r'subject':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.subject = valueDes;
          break;
        case r'groupColor':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.groupColor = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CalendarEventCustomFields deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CalendarEventCustomFieldsBuilder();
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
