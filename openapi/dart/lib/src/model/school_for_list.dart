//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

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

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SchoolForListBuilder b) => b;

  factory SchoolForList([void updates(SchoolForListBuilder b)]) =
      _$SchoolForList;

  @BuiltValueSerializer(custom: true)
  static Serializer<SchoolForList> get serializer =>
      _$SchoolForListSerializer();
}

class _$SchoolForListSerializer implements StructuredSerializer<SchoolForList> {
  @override
  final Iterable<Type> types = const [SchoolForList, _$SchoolForList];

  @override
  final String wireName = r'SchoolForList';

  @override
  Iterable<Object?> serialize(Serializers serializers, SchoolForList object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[];
    result
      ..add(r'assistant')
      ..add(serializers.serialize(object.assistant,
          specifiedType: const FullType(SchoolAssistant)));
    if (object.fallbackAssistant != null) {
      result
        ..add(r'fallbackAssistant')
        ..add(serializers.serialize(object.fallbackAssistant,
            specifiedType: const FullType(SchoolAssistant)));
    }
    result
      ..add(r'id')
      ..add(serializers.serialize(object.id,
          specifiedType: const FullType(String)));
    result
      ..add(r'code')
      ..add(serializers.serialize(object.code,
          specifiedType: const FullType(String)));
    result
      ..add(r'name')
      ..add(serializers.serialize(object.name,
          specifiedType: const FullType(String)));
    result
      ..add(r'siteUrl')
      ..add(serializers.serialize(object.siteUrl,
          specifiedType: const FullType(String)));
    result
      ..add(r'imageUrl')
      ..add(serializers.serialize(object.imageUrl,
          specifiedType: const FullType(String)));
    result
      ..add(r'intranetUrl')
      ..add(object.intranetUrl == null
          ? null
          : serializers.serialize(object.intranetUrl,
              specifiedType: const FullType.nullable(String)));
    result
      ..add(r'visible')
      ..add(serializers.serialize(object.visible,
          specifiedType: const FullType(bool)));
    result
      ..add(r'createdAt')
      ..add(serializers.serialize(object.createdAt,
          specifiedType: const FullType(DateTime)));
    result
      ..add(r'updatedAt')
      ..add(serializers.serialize(object.updatedAt,
          specifiedType: const FullType(DateTime)));
    if (object.deletedAt != null) {
      result
        ..add(r'deletedAt')
        ..add(serializers.serialize(object.deletedAt,
            specifiedType: const FullType(DateTime)));
    }
    return result;
  }

  @override
  SchoolForList deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = SchoolForListBuilder();

    final iterator = serialized.iterator;
    while (iterator.moveNext()) {
      final key = iterator.current as String;
      iterator.moveNext();
      final Object? value = iterator.current;

      switch (key) {
        case r'assistant':
          final valueDes = serializers.deserialize(value,
                  specifiedType: const FullType(SchoolAssistant))
              as SchoolAssistant;
          result.assistant.replace(valueDes);
          break;
        case r'fallbackAssistant':
          final valueDes = serializers.deserialize(value,
                  specifiedType: const FullType(SchoolAssistant))
              as SchoolAssistant;
          result.fallbackAssistant.replace(valueDes);
          break;
        case r'id':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.id = valueDes;
          break;
        case r'code':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.code = valueDes;
          break;
        case r'name':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.name = valueDes;
          break;
        case r'siteUrl':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.siteUrl = valueDes;
          break;
        case r'imageUrl':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.imageUrl = valueDes;
          break;
        case r'intranetUrl':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType.nullable(String)) as String?;
          if (valueDes == null) continue;
          result.intranetUrl = valueDes;
          break;
        case r'visible':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(bool)) as bool;
          result.visible = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(DateTime)) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(DateTime)) as DateTime;
          result.updatedAt = valueDes;
          break;
        case r'deletedAt':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(DateTime)) as DateTime;
          result.deletedAt = valueDes;
          break;
      }
    }
    return result.build();
  }
}
