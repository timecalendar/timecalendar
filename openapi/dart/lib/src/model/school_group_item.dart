//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
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
@BuiltValue()
abstract class SchoolGroupItem
    implements Built<SchoolGroupItem, SchoolGroupItemBuilder> {
  @BuiltValueField(wireName: r'text')
  String get text;

  @BuiltValueField(wireName: r'value')
  String get value;

  @BuiltValueField(wireName: r'children')
  BuiltList<SchoolGroupItem> get children;

  SchoolGroupItem._();

  factory SchoolGroupItem([void updates(SchoolGroupItemBuilder b)]) =
      _$SchoolGroupItem;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SchoolGroupItemBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SchoolGroupItem> get serializer =>
      _$SchoolGroupItemSerializer();
}

class _$SchoolGroupItemSerializer
    implements PrimitiveSerializer<SchoolGroupItem> {
  @override
  final Iterable<Type> types = const [SchoolGroupItem, _$SchoolGroupItem];

  @override
  final String wireName = r'SchoolGroupItem';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SchoolGroupItem object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'text';
    yield serializers.serialize(
      object.text,
      specifiedType: const FullType(String),
    );
    yield r'value';
    yield serializers.serialize(
      object.value,
      specifiedType: const FullType(String),
    );
    yield r'children';
    yield serializers.serialize(
      object.children,
      specifiedType: const FullType(BuiltList, [FullType(SchoolGroupItem)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SchoolGroupItem object, {
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
    required SchoolGroupItemBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'text':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.text = valueDes;
          break;
        case r'value':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.value = valueDes;
          break;
        case r'children':
          final valueDes = serializers.deserialize(
            value,
            specifiedType:
                const FullType(BuiltList, [FullType(SchoolGroupItem)]),
          ) as BuiltList<SchoolGroupItem>;
          result.children.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SchoolGroupItem deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SchoolGroupItemBuilder();
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
