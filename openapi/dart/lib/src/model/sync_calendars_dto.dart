//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'sync_calendars_dto.g.dart';

/// SyncCalendarsDto
///
/// Properties:
/// * [tokens]
@BuiltValue()
abstract class SyncCalendarsDto
    implements Built<SyncCalendarsDto, SyncCalendarsDtoBuilder> {
  @BuiltValueField(wireName: r'tokens')
  BuiltList<String> get tokens;

  SyncCalendarsDto._();

  factory SyncCalendarsDto([void updates(SyncCalendarsDtoBuilder b)]) =
      _$SyncCalendarsDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SyncCalendarsDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SyncCalendarsDto> get serializer =>
      _$SyncCalendarsDtoSerializer();
}

class _$SyncCalendarsDtoSerializer
    implements PrimitiveSerializer<SyncCalendarsDto> {
  @override
  final Iterable<Type> types = const [SyncCalendarsDto, _$SyncCalendarsDto];

  @override
  final String wireName = r'SyncCalendarsDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SyncCalendarsDto object, {
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
    SyncCalendarsDto object, {
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
    required SyncCalendarsDtoBuilder result,
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
  SyncCalendarsDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SyncCalendarsDtoBuilder();
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
