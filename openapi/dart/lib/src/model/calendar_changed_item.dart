//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:timecalendar_api/src/model/calendar_log_event_get.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'calendar_changed_item.g.dart';

/// CalendarChangedItem
///
/// Properties:
/// * [previousItem]
/// * [newItem]
@BuiltValue()
abstract class CalendarChangedItem
    implements Built<CalendarChangedItem, CalendarChangedItemBuilder> {
  @BuiltValueField(wireName: r'previousItem')
  CalendarLogEventGet get previousItem;

  @BuiltValueField(wireName: r'newItem')
  CalendarLogEventGet get newItem;

  CalendarChangedItem._();

  factory CalendarChangedItem([void updates(CalendarChangedItemBuilder b)]) =
      _$CalendarChangedItem;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CalendarChangedItemBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CalendarChangedItem> get serializer =>
      _$CalendarChangedItemSerializer();
}

class _$CalendarChangedItemSerializer
    implements PrimitiveSerializer<CalendarChangedItem> {
  @override
  final Iterable<Type> types = const [
    CalendarChangedItem,
    _$CalendarChangedItem
  ];

  @override
  final String wireName = r'CalendarChangedItem';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CalendarChangedItem object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'previousItem';
    yield serializers.serialize(
      object.previousItem,
      specifiedType: const FullType(CalendarLogEventGet),
    );
    yield r'newItem';
    yield serializers.serialize(
      object.newItem,
      specifiedType: const FullType(CalendarLogEventGet),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CalendarChangedItem object, {
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
    required CalendarChangedItemBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'previousItem':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CalendarLogEventGet),
          ) as CalendarLogEventGet;
          result.previousItem.replace(valueDes);
          break;
        case r'newItem':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CalendarLogEventGet),
          ) as CalendarLogEventGet;
          result.newItem.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CalendarChangedItem deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CalendarChangedItemBuilder();
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
