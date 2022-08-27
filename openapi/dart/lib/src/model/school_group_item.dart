//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'school_group_item.g.dart';

/// SchoolGroupItem
///
/// Properties:
/// * [text]
/// * [value]
/// * [children]
abstract class SchoolGroupItem
    implements Built<SchoolGroupItem, SchoolGroupItemBuilder> {
  @BuiltValueField(wireName: r'text')
  String get text;

  @BuiltValueField(wireName: r'value')
  String get value;

  @BuiltValueField(wireName: r'children')
  BuiltList<SchoolGroupItem> get children;

  SchoolGroupItem._();

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SchoolGroupItemBuilder b) => b;

  factory SchoolGroupItem([void updates(SchoolGroupItemBuilder b)]) =
      _$SchoolGroupItem;

  @BuiltValueSerializer(custom: true)
  static Serializer<SchoolGroupItem> get serializer =>
      _$SchoolGroupItemSerializer();
}

class _$SchoolGroupItemSerializer
    implements StructuredSerializer<SchoolGroupItem> {
  @override
  final Iterable<Type> types = const [SchoolGroupItem, _$SchoolGroupItem];

  @override
  final String wireName = r'SchoolGroupItem';

  @override
  Iterable<Object?> serialize(Serializers serializers, SchoolGroupItem object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[];
    result
      ..add(r'text')
      ..add(serializers.serialize(object.text,
          specifiedType: const FullType(String)));
    result
      ..add(r'value')
      ..add(serializers.serialize(object.value,
          specifiedType: const FullType(String)));
    result
      ..add(r'children')
      ..add(serializers.serialize(object.children,
          specifiedType:
              const FullType(BuiltList, [FullType(SchoolGroupItem)])));
    return result;
  }

  @override
  SchoolGroupItem deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = SchoolGroupItemBuilder();

    final iterator = serialized.iterator;
    while (iterator.moveNext()) {
      final key = iterator.current as String;
      iterator.moveNext();
      final Object? value = iterator.current;

      switch (key) {
        case r'text':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.text = valueDes;
          break;
        case r'value':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.value = valueDes;
          break;
        case r'children':
          final valueDes = serializers.deserialize(value,
                  specifiedType:
                      const FullType(BuiltList, [FullType(SchoolGroupItem)]))
              as BuiltList<SchoolGroupItem>;
          result.children.replace(valueDes);
          break;
      }
    }
    return result.build();
  }
}
