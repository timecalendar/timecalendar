//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'school_assistant.g.dart';

/// SchoolAssistant
///
/// Properties:
/// * [slug]
/// * [requireIntranetAccess]
/// * [requireCalendarName]
/// * [isNative]
@BuiltValue()
abstract class SchoolAssistant
    implements Built<SchoolAssistant, SchoolAssistantBuilder> {
  @BuiltValueField(wireName: r'slug')
  String get slug;

  @BuiltValueField(wireName: r'requireIntranetAccess')
  bool get requireIntranetAccess;

  @BuiltValueField(wireName: r'requireCalendarName')
  bool get requireCalendarName;

  @BuiltValueField(wireName: r'isNative')
  bool get isNative;

  SchoolAssistant._();

  factory SchoolAssistant([void updates(SchoolAssistantBuilder b)]) =
      _$SchoolAssistant;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SchoolAssistantBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SchoolAssistant> get serializer =>
      _$SchoolAssistantSerializer();
}

class _$SchoolAssistantSerializer
    implements PrimitiveSerializer<SchoolAssistant> {
  @override
  final Iterable<Type> types = const [SchoolAssistant, _$SchoolAssistant];

  @override
  final String wireName = r'SchoolAssistant';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SchoolAssistant object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'slug';
    yield serializers.serialize(
      object.slug,
      specifiedType: const FullType(String),
    );
    yield r'requireIntranetAccess';
    yield serializers.serialize(
      object.requireIntranetAccess,
      specifiedType: const FullType(bool),
    );
    yield r'requireCalendarName';
    yield serializers.serialize(
      object.requireCalendarName,
      specifiedType: const FullType(bool),
    );
    yield r'isNative';
    yield serializers.serialize(
      object.isNative,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SchoolAssistant object, {
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
    required SchoolAssistantBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'slug':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.slug = valueDes;
          break;
        case r'requireIntranetAccess':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.requireIntranetAccess = valueDes;
          break;
        case r'requireCalendarName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.requireCalendarName = valueDes;
          break;
        case r'isNative':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isNative = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SchoolAssistant deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SchoolAssistantBuilder();
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
