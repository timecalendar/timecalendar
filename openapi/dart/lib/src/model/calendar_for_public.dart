//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'calendar_for_public.g.dart';

/// CalendarForPublic
///
/// Properties:
/// * [id]
/// * [name]
/// * [schoolName]
/// * [schoolId]
/// * [lastUpdatedAt]
/// * [createdAt]
abstract class CalendarForPublic
    implements Built<CalendarForPublic, CalendarForPublicBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

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

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CalendarForPublicBuilder b) => b;

  factory CalendarForPublic([void updates(CalendarForPublicBuilder b)]) =
      _$CalendarForPublic;

  @BuiltValueSerializer(custom: true)
  static Serializer<CalendarForPublic> get serializer =>
      _$CalendarForPublicSerializer();
}

class _$CalendarForPublicSerializer
    implements StructuredSerializer<CalendarForPublic> {
  @override
  final Iterable<Type> types = const [CalendarForPublic, _$CalendarForPublic];

  @override
  final String wireName = r'CalendarForPublic';

  @override
  Iterable<Object?> serialize(Serializers serializers, CalendarForPublic object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[];
    result
      ..add(r'id')
      ..add(serializers.serialize(object.id,
          specifiedType: const FullType(String)));
    result
      ..add(r'name')
      ..add(serializers.serialize(object.name,
          specifiedType: const FullType(String)));
    result
      ..add(r'schoolName')
      ..add(object.schoolName == null
          ? null
          : serializers.serialize(object.schoolName,
              specifiedType: const FullType.nullable(String)));
    result
      ..add(r'schoolId')
      ..add(serializers.serialize(object.schoolId,
          specifiedType: const FullType(String)));
    result
      ..add(r'lastUpdatedAt')
      ..add(serializers.serialize(object.lastUpdatedAt,
          specifiedType: const FullType(DateTime)));
    result
      ..add(r'createdAt')
      ..add(serializers.serialize(object.createdAt,
          specifiedType: const FullType(DateTime)));
    return result;
  }

  @override
  CalendarForPublic deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = CalendarForPublicBuilder();

    final iterator = serialized.iterator;
    while (iterator.moveNext()) {
      final key = iterator.current as String;
      iterator.moveNext();
      final Object? value = iterator.current;

      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.id = valueDes;
          break;
        case r'name':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.name = valueDes;
          break;
        case r'schoolName':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType.nullable(String)) as String?;
          if (valueDes == null) continue;
          result.schoolName = valueDes;
          break;
        case r'schoolId':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.schoolId = valueDes;
          break;
        case r'lastUpdatedAt':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(DateTime)) as DateTime;
          result.lastUpdatedAt = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(DateTime)) as DateTime;
          result.createdAt = valueDes;
          break;
      }
    }
    return result.build();
  }
}
