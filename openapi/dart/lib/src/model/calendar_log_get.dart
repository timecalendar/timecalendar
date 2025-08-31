//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:timecalendar_api/src/model/calendar_change_get.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'calendar_log_get.g.dart';

/// CalendarLogGet
///
/// Properties:
/// * [id]
/// * [calendarId]
/// * [calendarToken]
/// * [calendarName]
/// * [calendarChange]
/// * [createdAt]
/// * [updatedAt]
@BuiltValue()
abstract class CalendarLogGet
    implements Built<CalendarLogGet, CalendarLogGetBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'calendarId')
  String get calendarId;

  @BuiltValueField(wireName: r'calendarToken')
  String get calendarToken;

  @BuiltValueField(wireName: r'calendarName')
  String get calendarName;

  @BuiltValueField(wireName: r'calendarChange')
  CalendarChangeGet get calendarChange;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  @BuiltValueField(wireName: r'updatedAt')
  DateTime get updatedAt;

  CalendarLogGet._();

  factory CalendarLogGet([void updates(CalendarLogGetBuilder b)]) =
      _$CalendarLogGet;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CalendarLogGetBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CalendarLogGet> get serializer =>
      _$CalendarLogGetSerializer();
}

class _$CalendarLogGetSerializer
    implements PrimitiveSerializer<CalendarLogGet> {
  @override
  final Iterable<Type> types = const [CalendarLogGet, _$CalendarLogGet];

  @override
  final String wireName = r'CalendarLogGet';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CalendarLogGet object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'calendarId';
    yield serializers.serialize(
      object.calendarId,
      specifiedType: const FullType(String),
    );
    yield r'calendarToken';
    yield serializers.serialize(
      object.calendarToken,
      specifiedType: const FullType(String),
    );
    yield r'calendarName';
    yield serializers.serialize(
      object.calendarName,
      specifiedType: const FullType(String),
    );
    yield r'calendarChange';
    yield serializers.serialize(
      object.calendarChange,
      specifiedType: const FullType(CalendarChangeGet),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CalendarLogGet object, {
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
    required CalendarLogGetBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'calendarId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.calendarId = valueDes;
          break;
        case r'calendarToken':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.calendarToken = valueDes;
          break;
        case r'calendarName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.calendarName = valueDes;
          break;
        case r'calendarChange':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CalendarChangeGet),
          ) as CalendarChangeGet;
          result.calendarChange.replace(valueDes);
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.updatedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CalendarLogGet deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CalendarLogGetBuilder();
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
