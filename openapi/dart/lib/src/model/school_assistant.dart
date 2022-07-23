//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

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

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SchoolAssistantBuilder b) => b;

  factory SchoolAssistant([void updates(SchoolAssistantBuilder b)]) =
      _$SchoolAssistant;

  @BuiltValueSerializer(custom: true)
  static Serializer<SchoolAssistant> get serializer =>
      _$SchoolAssistantSerializer();
}

class _$SchoolAssistantSerializer
    implements StructuredSerializer<SchoolAssistant> {
  @override
  final Iterable<Type> types = const [SchoolAssistant, _$SchoolAssistant];

  @override
  final String wireName = r'SchoolAssistant';

  @override
  Iterable<Object?> serialize(Serializers serializers, SchoolAssistant object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[];
    result
      ..add(r'slug')
      ..add(serializers.serialize(object.slug,
          specifiedType: const FullType(String)));
    result
      ..add(r'requireIntranetAccess')
      ..add(serializers.serialize(object.requireIntranetAccess,
          specifiedType: const FullType(bool)));
    result
      ..add(r'requireCalendarName')
      ..add(serializers.serialize(object.requireCalendarName,
          specifiedType: const FullType(bool)));
    result
      ..add(r'isNative')
      ..add(serializers.serialize(object.isNative,
          specifiedType: const FullType(bool)));
    return result;
  }

  @override
  SchoolAssistant deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = SchoolAssistantBuilder();

    final iterator = serialized.iterator;
    while (iterator.moveNext()) {
      final key = iterator.current as String;
      iterator.moveNext();
      final Object? value = iterator.current;

      switch (key) {
        case r'slug':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.slug = valueDes;
          break;
        case r'requireIntranetAccess':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(bool)) as bool;
          result.requireIntranetAccess = valueDes;
          break;
        case r'requireCalendarName':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(bool)) as bool;
          result.requireCalendarName = valueDes;
          break;
        case r'isNative':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(bool)) as bool;
          result.isNative = valueDes;
          break;
      }
    }
    return result.build();
  }
}
