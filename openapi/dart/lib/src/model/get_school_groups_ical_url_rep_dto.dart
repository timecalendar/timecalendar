//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'get_school_groups_ical_url_rep_dto.g.dart';

/// GetSchoolGroupsIcalUrlRepDto
///
/// Properties:
/// * [url]
abstract class GetSchoolGroupsIcalUrlRepDto
    implements
        Built<GetSchoolGroupsIcalUrlRepDto,
            GetSchoolGroupsIcalUrlRepDtoBuilder> {
  @BuiltValueField(wireName: r'url')
  String get url;

  GetSchoolGroupsIcalUrlRepDto._();

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(GetSchoolGroupsIcalUrlRepDtoBuilder b) => b;

  factory GetSchoolGroupsIcalUrlRepDto(
          [void updates(GetSchoolGroupsIcalUrlRepDtoBuilder b)]) =
      _$GetSchoolGroupsIcalUrlRepDto;

  @BuiltValueSerializer(custom: true)
  static Serializer<GetSchoolGroupsIcalUrlRepDto> get serializer =>
      _$GetSchoolGroupsIcalUrlRepDtoSerializer();
}

class _$GetSchoolGroupsIcalUrlRepDtoSerializer
    implements StructuredSerializer<GetSchoolGroupsIcalUrlRepDto> {
  @override
  final Iterable<Type> types = const [
    GetSchoolGroupsIcalUrlRepDto,
    _$GetSchoolGroupsIcalUrlRepDto
  ];

  @override
  final String wireName = r'GetSchoolGroupsIcalUrlRepDto';

  @override
  Iterable<Object?> serialize(
      Serializers serializers, GetSchoolGroupsIcalUrlRepDto object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[];
    result
      ..add(r'url')
      ..add(serializers.serialize(object.url,
          specifiedType: const FullType(String)));
    return result;
  }

  @override
  GetSchoolGroupsIcalUrlRepDto deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = GetSchoolGroupsIcalUrlRepDtoBuilder();

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
      }
    }
    return result.build();
  }
}
