//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'search_schools_dto.g.dart';

/// SearchSchoolsDto
///
/// Properties:
/// * [seoUrl]
@BuiltValue()
abstract class SearchSchoolsDto
    implements Built<SearchSchoolsDto, SearchSchoolsDtoBuilder> {
  @BuiltValueField(wireName: r'seoUrl')
  String get seoUrl;

  SearchSchoolsDto._();

  factory SearchSchoolsDto([void updates(SearchSchoolsDtoBuilder b)]) =
      _$SearchSchoolsDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SearchSchoolsDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SearchSchoolsDto> get serializer =>
      _$SearchSchoolsDtoSerializer();
}

class _$SearchSchoolsDtoSerializer
    implements PrimitiveSerializer<SearchSchoolsDto> {
  @override
  final Iterable<Type> types = const [SearchSchoolsDto, _$SearchSchoolsDto];

  @override
  final String wireName = r'SearchSchoolsDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SearchSchoolsDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'seoUrl';
    yield serializers.serialize(
      object.seoUrl,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SearchSchoolsDto object, {
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
    required SearchSchoolsDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'seoUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.seoUrl = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SearchSchoolsDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SearchSchoolsDtoBuilder();
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
