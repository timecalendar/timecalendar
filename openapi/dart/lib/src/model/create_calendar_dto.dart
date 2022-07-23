//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_calendar_dto.g.dart';

/// CreateCalendarDto
///
/// Properties:
/// * [url]
/// * [schoolId]
/// * [schoolName]
/// * [name]
/// * [customData]
abstract class CreateCalendarDto
    implements Built<CreateCalendarDto, CreateCalendarDtoBuilder> {
  @BuiltValueField(wireName: r'url')
  String get url;

  @BuiltValueField(wireName: r'schoolId')
  String? get schoolId;

  @BuiltValueField(wireName: r'schoolName')
  String? get schoolName;

  @BuiltValueField(wireName: r'name')
  String? get name;

  @BuiltValueField(wireName: r'customData')
  JsonObject? get customData;

  CreateCalendarDto._();

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateCalendarDtoBuilder b) => b;

  factory CreateCalendarDto([void updates(CreateCalendarDtoBuilder b)]) =
      _$CreateCalendarDto;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateCalendarDto> get serializer =>
      _$CreateCalendarDtoSerializer();
}

class _$CreateCalendarDtoSerializer
    implements StructuredSerializer<CreateCalendarDto> {
  @override
  final Iterable<Type> types = const [CreateCalendarDto, _$CreateCalendarDto];

  @override
  final String wireName = r'CreateCalendarDto';

  @override
  Iterable<Object?> serialize(Serializers serializers, CreateCalendarDto object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[];
    result
      ..add(r'url')
      ..add(serializers.serialize(object.url,
          specifiedType: const FullType(String)));
    if (object.schoolId != null) {
      result
        ..add(r'schoolId')
        ..add(serializers.serialize(object.schoolId,
            specifiedType: const FullType(String)));
    }
    if (object.schoolName != null) {
      result
        ..add(r'schoolName')
        ..add(serializers.serialize(object.schoolName,
            specifiedType: const FullType(String)));
    }
    if (object.name != null) {
      result
        ..add(r'name')
        ..add(serializers.serialize(object.name,
            specifiedType: const FullType(String)));
    }
    result
      ..add(r'customData')
      ..add(object.customData == null
          ? null
          : serializers.serialize(object.customData,
              specifiedType: const FullType.nullable(JsonObject)));
    return result;
  }

  @override
  CreateCalendarDto deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = CreateCalendarDtoBuilder();

    final iterator = serialized.iterator;
    while (iterator.moveNext()) {
      final key = iterator.current as String;
      iterator.moveNext();
      final Object? value = iterator.current;

      switch (key) {
        case r'url':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.url = valueDes;
          break;
        case r'schoolId':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.schoolId = valueDes;
          break;
        case r'schoolName':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.schoolName = valueDes;
          break;
        case r'name':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.name = valueDes;
          break;
        case r'customData':
          final valueDes = serializers.deserialize(value,
                  specifiedType: const FullType.nullable(JsonObject))
              as JsonObject?;
          if (valueDes == null) continue;
          result.customData = valueDes;
          break;
      }
    }
    return result.build();
  }
}
