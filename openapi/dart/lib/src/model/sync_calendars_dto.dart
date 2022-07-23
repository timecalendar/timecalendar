//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'sync_calendars_dto.g.dart';

/// SyncCalendarsDto
///
/// Properties:
/// * [calendarIds]
abstract class SyncCalendarsDto
    implements Built<SyncCalendarsDto, SyncCalendarsDtoBuilder> {
  @BuiltValueField(wireName: r'calendarIds')
  BuiltList<String> get calendarIds;

  SyncCalendarsDto._();

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SyncCalendarsDtoBuilder b) => b;

  factory SyncCalendarsDto([void updates(SyncCalendarsDtoBuilder b)]) =
      _$SyncCalendarsDto;

  @BuiltValueSerializer(custom: true)
  static Serializer<SyncCalendarsDto> get serializer =>
      _$SyncCalendarsDtoSerializer();
}

class _$SyncCalendarsDtoSerializer
    implements StructuredSerializer<SyncCalendarsDto> {
  @override
  final Iterable<Type> types = const [SyncCalendarsDto, _$SyncCalendarsDto];

  @override
  final String wireName = r'SyncCalendarsDto';

  @override
  Iterable<Object?> serialize(Serializers serializers, SyncCalendarsDto object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[];
    result
      ..add(r'calendarIds')
      ..add(serializers.serialize(object.calendarIds,
          specifiedType: const FullType(BuiltList, [FullType(String)])));
    return result;
  }

  @override
  SyncCalendarsDto deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = SyncCalendarsDtoBuilder();

    final iterator = serialized.iterator;
    while (iterator.moveNext()) {
      final key = iterator.current as String;
      iterator.moveNext();
      final Object? value = iterator.current;

      switch (key) {
        case r'calendarIds':
          final valueDes = serializers.deserialize(value,
                  specifiedType: const FullType(BuiltList, [FullType(String)]))
              as BuiltList<String>;
          result.calendarIds.replace(valueDes);
          break;
      }
    }
    return result.build();
  }
}
