//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'calendar_for_public.g.dart';

/// CalendarForPublic
///
/// Properties:
/// * [id]
/// * [token]
/// * [name]
/// * [schoolName]
/// * [schoolId]
/// * [lastUpdatedAt]
/// * [createdAt]
@BuiltValue()
abstract class CalendarForPublic
    implements Built<CalendarForPublic, CalendarForPublicBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'token')
  String get token;

  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'schoolName')
  String? get schoolName;

  @BuiltValueField(wireName: r'schoolId')
  String get schoolId;

  @BuiltValueField(wireName: r'lastUpdatedAt')
  DateTime get lastUpdatedAt;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  CalendarForPublic._();

  factory CalendarForPublic([void updates(CalendarForPublicBuilder b)]) =
      _$CalendarForPublic;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CalendarForPublicBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CalendarForPublic> get serializer =>
      _$CalendarForPublicSerializer();
}

class _$CalendarForPublicSerializer
    implements PrimitiveSerializer<CalendarForPublic> {
  @override
  final Iterable<Type> types = const [CalendarForPublic, _$CalendarForPublic];

  @override
  final String wireName = r'CalendarForPublic';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CalendarForPublic object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'token';
    yield serializers.serialize(
      object.token,
      specifiedType: const FullType(String),
    );
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    yield r'schoolName';
    yield object.schoolName == null
        ? null
        : serializers.serialize(
            object.schoolName,
            specifiedType: const FullType.nullable(String),
          );
    yield r'schoolId';
    yield serializers.serialize(
      object.schoolId,
      specifiedType: const FullType(String),
    );
    yield r'lastUpdatedAt';
    yield serializers.serialize(
      object.lastUpdatedAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CalendarForPublic object, {
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
    required CalendarForPublicBuilder result,
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
        case r'token':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.token = valueDes;
          break;
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        case r'schoolName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.schoolName = valueDes;
          break;
        case r'schoolId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.schoolId = valueDes;
          break;
        case r'lastUpdatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.lastUpdatedAt = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CalendarForPublic deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CalendarForPublicBuilder();
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
