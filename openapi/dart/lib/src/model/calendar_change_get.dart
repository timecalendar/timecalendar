//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:timecalendar_api/src/model/calendar_log_event_get.dart';
import 'package:timecalendar_api/src/model/calendar_changed_item.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'calendar_change_get.g.dart';

/// CalendarChangeGet
///
/// Properties:
/// * [oldItems]
/// * [newItems]
/// * [changedItems]
@BuiltValue()
abstract class CalendarChangeGet
    implements Built<CalendarChangeGet, CalendarChangeGetBuilder> {
  @BuiltValueField(wireName: r'oldItems')
  BuiltList<CalendarLogEventGet> get oldItems;

  @BuiltValueField(wireName: r'newItems')
  BuiltList<CalendarLogEventGet> get newItems;

  @BuiltValueField(wireName: r'changedItems')
  BuiltList<CalendarChangedItem> get changedItems;

  CalendarChangeGet._();

  factory CalendarChangeGet([void updates(CalendarChangeGetBuilder b)]) =
      _$CalendarChangeGet;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CalendarChangeGetBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CalendarChangeGet> get serializer =>
      _$CalendarChangeGetSerializer();
}

class _$CalendarChangeGetSerializer
    implements PrimitiveSerializer<CalendarChangeGet> {
  @override
  final Iterable<Type> types = const [CalendarChangeGet, _$CalendarChangeGet];

  @override
  final String wireName = r'CalendarChangeGet';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CalendarChangeGet object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'oldItems';
    yield serializers.serialize(
      object.oldItems,
      specifiedType: const FullType(BuiltList, [FullType(CalendarLogEventGet)]),
    );
    yield r'newItems';
    yield serializers.serialize(
      object.newItems,
      specifiedType: const FullType(BuiltList, [FullType(CalendarLogEventGet)]),
    );
    yield r'changedItems';
    yield serializers.serialize(
      object.changedItems,
      specifiedType: const FullType(BuiltList, [FullType(CalendarChangedItem)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CalendarChangeGet object, {
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
    required CalendarChangeGetBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'oldItems':
          final valueDes = serializers.deserialize(
            value,
            specifiedType:
                const FullType(BuiltList, [FullType(CalendarLogEventGet)]),
          ) as BuiltList<CalendarLogEventGet>;
          result.oldItems.replace(valueDes);
          break;
        case r'newItems':
          final valueDes = serializers.deserialize(
            value,
            specifiedType:
                const FullType(BuiltList, [FullType(CalendarLogEventGet)]),
          ) as BuiltList<CalendarLogEventGet>;
          result.newItems.replace(valueDes);
          break;
        case r'changedItems':
          final valueDes = serializers.deserialize(
            value,
            specifiedType:
                const FullType(BuiltList, [FullType(CalendarChangedItem)]),
          ) as BuiltList<CalendarChangedItem>;
          result.changedItems.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CalendarChangeGet deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CalendarChangeGetBuilder();
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
