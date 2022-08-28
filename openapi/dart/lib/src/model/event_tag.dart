//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'event_tag.g.dart';

/// EventTag
///
/// Properties:
/// * [name]
/// * [color]
/// * [icon]
abstract class EventTag implements Built<EventTag, EventTagBuilder> {
  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'color')
  String get color;

  @BuiltValueField(wireName: r'icon')
  String get icon;

  EventTag._();

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(EventTagBuilder b) => b;

  factory EventTag([void updates(EventTagBuilder b)]) = _$EventTag;

  @BuiltValueSerializer(custom: true)
  static Serializer<EventTag> get serializer => _$EventTagSerializer();
}

class _$EventTagSerializer implements StructuredSerializer<EventTag> {
  @override
  final Iterable<Type> types = const [EventTag, _$EventTag];

  @override
  final String wireName = r'EventTag';

  @override
  Iterable<Object?> serialize(Serializers serializers, EventTag object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[];
    result
      ..add(r'name')
      ..add(serializers.serialize(object.name,
          specifiedType: const FullType(String)));
    result
      ..add(r'color')
      ..add(serializers.serialize(object.color,
          specifiedType: const FullType(String)));
    result
      ..add(r'icon')
      ..add(serializers.serialize(object.icon,
          specifiedType: const FullType(String)));
    return result;
  }

  @override
  EventTag deserialize(Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = EventTagBuilder();

    final iterator = serialized.iterator;
    while (iterator.moveNext()) {
      final key = iterator.current as String;
      iterator.moveNext();
      final Object? value = iterator.current;

      switch (key) {
        case r'name':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.name = valueDes;
          break;
        case r'color':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.color = valueDes;
          break;
        case r'icon':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.icon = valueDes;
          break;
      }
    }
    return result.build();
  }
}
