//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'get_calendar_logs_dto.g.dart';

/// GetCalendarLogsDto
///
/// Properties:
/// * [tokens]
@BuiltValue()
abstract class GetCalendarLogsDto
    implements Built<GetCalendarLogsDto, GetCalendarLogsDtoBuilder> {
  @BuiltValueField(wireName: r'tokens')
  BuiltList<String> get tokens;

  GetCalendarLogsDto._();

  factory GetCalendarLogsDto([void updates(GetCalendarLogsDtoBuilder b)]) =
      _$GetCalendarLogsDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(GetCalendarLogsDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<GetCalendarLogsDto> get serializer =>
      _$GetCalendarLogsDtoSerializer();
}

class _$GetCalendarLogsDtoSerializer
    implements PrimitiveSerializer<GetCalendarLogsDto> {
  @override
  final Iterable<Type> types = const [GetCalendarLogsDto, _$GetCalendarLogsDto];

  @override
  final String wireName = r'GetCalendarLogsDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    GetCalendarLogsDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'tokens';
    yield serializers.serialize(
      object.tokens,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    GetCalendarLogsDto object, {
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
    required GetCalendarLogsDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'tokens':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.tokens.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  GetCalendarLogsDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = GetCalendarLogsDtoBuilder();
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
