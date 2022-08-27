//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:built_collection/built_collection.dart';
import 'package:timecalendar_api/src/model/school_group_item.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'set_school_group_dto.g.dart';

/// SetSchoolGroupDto
///
/// Properties:
/// * [groups]
/// * [icalUrl]
abstract class SetSchoolGroupDto
    implements Built<SetSchoolGroupDto, SetSchoolGroupDtoBuilder> {
  @BuiltValueField(wireName: r'groups')
  BuiltList<SchoolGroupItem> get groups;

  @BuiltValueField(wireName: r'icalUrl')
  String get icalUrl;

  SetSchoolGroupDto._();

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SetSchoolGroupDtoBuilder b) => b;

  factory SetSchoolGroupDto([void updates(SetSchoolGroupDtoBuilder b)]) =
      _$SetSchoolGroupDto;

  @BuiltValueSerializer(custom: true)
  static Serializer<SetSchoolGroupDto> get serializer =>
      _$SetSchoolGroupDtoSerializer();
}

class _$SetSchoolGroupDtoSerializer
    implements StructuredSerializer<SetSchoolGroupDto> {
  @override
  final Iterable<Type> types = const [SetSchoolGroupDto, _$SetSchoolGroupDto];

  @override
  final String wireName = r'SetSchoolGroupDto';

  @override
  Iterable<Object?> serialize(Serializers serializers, SetSchoolGroupDto object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[];
    result
      ..add(r'groups')
      ..add(serializers.serialize(object.groups,
          specifiedType:
              const FullType(BuiltList, [FullType(SchoolGroupItem)])));
    result
      ..add(r'icalUrl')
      ..add(serializers.serialize(object.icalUrl,
          specifiedType: const FullType(String)));
    return result;
  }

  @override
  SetSchoolGroupDto deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = SetSchoolGroupDtoBuilder();

    final iterator = serialized.iterator;
    while (iterator.moveNext()) {
      final key = iterator.current as String;
      iterator.moveNext();
      final Object? value = iterator.current;

      switch (key) {
        case r'groups':
          final valueDes = serializers.deserialize(value,
                  specifiedType:
                      const FullType(BuiltList, [FullType(SchoolGroupItem)]))
              as BuiltList<SchoolGroupItem>;
          result.groups.replace(valueDes);
          break;
        case r'icalUrl':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.icalUrl = valueDes;
          break;
      }
    }
    return result.build();
  }
}
