//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'send_message_dto.g.dart';

/// SendMessageDto
///
/// Properties:
/// * [email]
/// * [message]
/// * [calendarIds]
/// * [schoolId]
/// * [schoolName]
/// * [gradeName]
/// * [deviceInfo]
abstract class SendMessageDto
    implements Built<SendMessageDto, SendMessageDtoBuilder> {
  @BuiltValueField(wireName: r'email')
  String get email;

  @BuiltValueField(wireName: r'message')
  String get message;

  @BuiltValueField(wireName: r'calendarIds')
  BuiltList<String>? get calendarIds;

  @BuiltValueField(wireName: r'schoolId')
  String? get schoolId;

  @BuiltValueField(wireName: r'schoolName')
  String? get schoolName;

  @BuiltValueField(wireName: r'gradeName')
  String? get gradeName;

  @BuiltValueField(wireName: r'deviceInfo')
  String? get deviceInfo;

  SendMessageDto._();

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SendMessageDtoBuilder b) => b;

  factory SendMessageDto([void updates(SendMessageDtoBuilder b)]) =
      _$SendMessageDto;

  @BuiltValueSerializer(custom: true)
  static Serializer<SendMessageDto> get serializer =>
      _$SendMessageDtoSerializer();
}

class _$SendMessageDtoSerializer
    implements StructuredSerializer<SendMessageDto> {
  @override
  final Iterable<Type> types = const [SendMessageDto, _$SendMessageDto];

  @override
  final String wireName = r'SendMessageDto';

  @override
  Iterable<Object?> serialize(Serializers serializers, SendMessageDto object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[];
    result
      ..add(r'email')
      ..add(serializers.serialize(object.email,
          specifiedType: const FullType(String)));
    result
      ..add(r'message')
      ..add(serializers.serialize(object.message,
          specifiedType: const FullType(String)));
    if (object.calendarIds != null) {
      result
        ..add(r'calendarIds')
        ..add(serializers.serialize(object.calendarIds,
            specifiedType: const FullType(BuiltList, [FullType(String)])));
    }
    if (object.schoolId != null) {
      result
        ..add(r'schoolId')
        ..add(serializers.serialize(object.schoolId,
            specifiedType: const FullType(String)));
    }
    if (object.schoolName != null) {
      result
        ..add(r'schoolName')
        ..add(serializers.serialize(object.schoolName,
            specifiedType: const FullType(String)));
    }
    if (object.gradeName != null) {
      result
        ..add(r'gradeName')
        ..add(serializers.serialize(object.gradeName,
            specifiedType: const FullType(String)));
    }
    if (object.deviceInfo != null) {
      result
        ..add(r'deviceInfo')
        ..add(serializers.serialize(object.deviceInfo,
            specifiedType: const FullType(String)));
    }
    return result;
  }

  @override
  SendMessageDto deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = SendMessageDtoBuilder();

    final iterator = serialized.iterator;
    while (iterator.moveNext()) {
      final key = iterator.current as String;
      iterator.moveNext();
      final Object? value = iterator.current;

      switch (key) {
        case r'email':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.email = valueDes;
          break;
        case r'message':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.message = valueDes;
          break;
        case r'calendarIds':
          final valueDes = serializers.deserialize(value,
                  specifiedType: const FullType(BuiltList, [FullType(String)]))
              as BuiltList<String>;
          result.calendarIds.replace(valueDes);
          break;
        case r'schoolId':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.schoolId = valueDes;
          break;
        case r'schoolName':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.schoolName = valueDes;
          break;
        case r'gradeName':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.gradeName = valueDes;
          break;
        case r'deviceInfo':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.deviceInfo = valueDes;
          break;
      }
    }
    return result.build();
  }
}
