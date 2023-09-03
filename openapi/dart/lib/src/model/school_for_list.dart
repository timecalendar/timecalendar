//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:timecalendar_api/src/model/school_assistant.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'school_for_list.g.dart';

/// SchoolForList
///
/// Properties:
/// * [assistant]
/// * [fallbackAssistant]
/// * [id]
/// * [code]
/// * [name]
/// * [siteUrl]
/// * [imageUrl]
/// * [intranetUrl]
/// * [visible]
/// * [createdAt]
/// * [updatedAt]
/// * [deletedAt]
@BuiltValue()
abstract class SchoolForList
    implements Built<SchoolForList, SchoolForListBuilder> {
  @BuiltValueField(wireName: r'assistant')
  SchoolAssistant get assistant;

  @BuiltValueField(wireName: r'fallbackAssistant')
  SchoolAssistant? get fallbackAssistant;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'code')
  String get code;

  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'siteUrl')
  String get siteUrl;

  @BuiltValueField(wireName: r'imageUrl')
  String get imageUrl;

  @BuiltValueField(wireName: r'intranetUrl')
  String? get intranetUrl;

  @BuiltValueField(wireName: r'visible')
  bool get visible;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  @BuiltValueField(wireName: r'updatedAt')
  DateTime get updatedAt;

  @BuiltValueField(wireName: r'deletedAt')
  DateTime? get deletedAt;

  SchoolForList._();

  factory SchoolForList([void updates(SchoolForListBuilder b)]) =
      _$SchoolForList;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SchoolForListBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SchoolForList> get serializer =>
      _$SchoolForListSerializer();
}

class _$SchoolForListSerializer implements PrimitiveSerializer<SchoolForList> {
  @override
  final Iterable<Type> types = const [SchoolForList, _$SchoolForList];

  @override
  final String wireName = r'SchoolForList';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SchoolForList object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'assistant';
    yield serializers.serialize(
      object.assistant,
      specifiedType: const FullType(SchoolAssistant),
    );
    if (object.fallbackAssistant != null) {
      yield r'fallbackAssistant';
      yield serializers.serialize(
        object.fallbackAssistant,
        specifiedType: const FullType(SchoolAssistant),
      );
    }
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'code';
    yield serializers.serialize(
      object.code,
      specifiedType: const FullType(String),
    );
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    yield r'siteUrl';
    yield serializers.serialize(
      object.siteUrl,
      specifiedType: const FullType(String),
    );
    yield r'imageUrl';
    yield serializers.serialize(
      object.imageUrl,
      specifiedType: const FullType(String),
    );
    yield r'intranetUrl';
    yield object.intranetUrl == null
        ? null
        : serializers.serialize(
            object.intranetUrl,
            specifiedType: const FullType.nullable(String),
          );
    yield r'visible';
    yield serializers.serialize(
      object.visible,
      specifiedType: const FullType(bool),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(DateTime),
    );
    if (object.deletedAt != null) {
      yield r'deletedAt';
      yield serializers.serialize(
        object.deletedAt,
        specifiedType: const FullType(DateTime),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    SchoolForList object, {
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
    required SchoolForListBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'assistant':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SchoolAssistant),
          ) as SchoolAssistant;
          result.assistant.replace(valueDes);
          break;
        case r'fallbackAssistant':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SchoolAssistant),
          ) as SchoolAssistant;
          result.fallbackAssistant.replace(valueDes);
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'code':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.code = valueDes;
          break;
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        case r'siteUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.siteUrl = valueDes;
          break;
        case r'imageUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.imageUrl = valueDes;
          break;
        case r'intranetUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.intranetUrl = valueDes;
          break;
        case r'visible':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.visible = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.updatedAt = valueDes;
          break;
        case r'deletedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.deletedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SchoolForList deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SchoolForListBuilder();
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
