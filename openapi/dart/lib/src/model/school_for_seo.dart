//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:timecalendar_api/src/model/school_profile_get.dart';
import 'package:timecalendar_api/src/model/school_assistant.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'school_for_seo.g.dart';

/// SchoolForSeo
///
/// Properties:
/// * [assistant]
/// * [fallbackAssistant]
/// * [id]
/// * [code]
/// * [name]
/// * [seoUrl] - The URL of the school landing page for SEO purposes
/// * [siteUrl]
/// * [imageUrl]
/// * [intranetUrl]
/// * [visible]
/// * [createdAt]
/// * [updatedAt]
/// * [deletedAt]
/// * [profile]
@BuiltValue()
abstract class SchoolForSeo
    implements Built<SchoolForSeo, SchoolForSeoBuilder> {
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

  /// The URL of the school landing page for SEO purposes
  @BuiltValueField(wireName: r'seoUrl')
  String? get seoUrl;

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

  @BuiltValueField(wireName: r'profile')
  SchoolProfileGet? get profile;

  SchoolForSeo._();

  factory SchoolForSeo([void updates(SchoolForSeoBuilder b)]) = _$SchoolForSeo;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SchoolForSeoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SchoolForSeo> get serializer => _$SchoolForSeoSerializer();
}

class _$SchoolForSeoSerializer implements PrimitiveSerializer<SchoolForSeo> {
  @override
  final Iterable<Type> types = const [SchoolForSeo, _$SchoolForSeo];

  @override
  final String wireName = r'SchoolForSeo';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SchoolForSeo object, {
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
    if (object.seoUrl != null) {
      yield r'seoUrl';
      yield serializers.serialize(
        object.seoUrl,
        specifiedType: const FullType(String),
      );
    }
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
    if (object.profile != null) {
      yield r'profile';
      yield serializers.serialize(
        object.profile,
        specifiedType: const FullType(SchoolProfileGet),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    SchoolForSeo object, {
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
    required SchoolForSeoBuilder result,
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
        case r'seoUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.seoUrl = valueDes;
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
        case r'profile':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SchoolProfileGet),
          ) as SchoolProfileGet;
          result.profile.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SchoolForSeo deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SchoolForSeoBuilder();
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
