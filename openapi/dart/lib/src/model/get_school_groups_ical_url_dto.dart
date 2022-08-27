//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'get_school_groups_ical_url_dto.g.dart';

/// GetSchoolGroupsIcalUrlDto
///
/// Properties:
/// * [groups]
abstract class GetSchoolGroupsIcalUrlDto
    implements
        Built<GetSchoolGroupsIcalUrlDto, GetSchoolGroupsIcalUrlDtoBuilder> {
  @BuiltValueField(wireName: r'groups')
  BuiltList<String> get groups;

  GetSchoolGroupsIcalUrlDto._();

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(GetSchoolGroupsIcalUrlDtoBuilder b) => b;

  factory GetSchoolGroupsIcalUrlDto(
          [void updates(GetSchoolGroupsIcalUrlDtoBuilder b)]) =
      _$GetSchoolGroupsIcalUrlDto;

  @BuiltValueSerializer(custom: true)
  static Serializer<GetSchoolGroupsIcalUrlDto> get serializer =>
      _$GetSchoolGroupsIcalUrlDtoSerializer();
}

class _$GetSchoolGroupsIcalUrlDtoSerializer
    implements StructuredSerializer<GetSchoolGroupsIcalUrlDto> {
  @override
  final Iterable<Type> types = const [
    GetSchoolGroupsIcalUrlDto,
    _$GetSchoolGroupsIcalUrlDto
  ];

  @override
  final String wireName = r'GetSchoolGroupsIcalUrlDto';

  @override
  Iterable<Object?> serialize(
      Serializers serializers, GetSchoolGroupsIcalUrlDto object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[];
    result
      ..add(r'groups')
      ..add(serializers.serialize(object.groups,
          specifiedType: const FullType(BuiltList, [FullType(String)])));
    return result;
  }

  @override
  GetSchoolGroupsIcalUrlDto deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = GetSchoolGroupsIcalUrlDtoBuilder();

    final iterator = serialized.iterator;
    while (iterator.moveNext()) {
      final key = iterator.current as String;
      iterator.moveNext();
      final Object? value = iterator.current;

      switch (key) {
        case r'groups':
          final valueDes = serializers.deserialize(value,
                  specifiedType: const FullType(BuiltList, [FullType(String)]))
              as BuiltList<String>;
          result.groups.replace(valueDes);
          break;
      }
    }
    return result.build();
  }
}
