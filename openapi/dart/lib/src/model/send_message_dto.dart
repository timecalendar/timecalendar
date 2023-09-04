//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
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
/// * [calendarUrl]
@BuiltValue()
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

  @BuiltValueField(wireName: r'calendarUrl')
  String? get calendarUrl;

  SendMessageDto._();

  factory SendMessageDto([void updates(SendMessageDtoBuilder b)]) =
      _$SendMessageDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SendMessageDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SendMessageDto> get serializer =>
      _$SendMessageDtoSerializer();
}

class _$SendMessageDtoSerializer
    implements PrimitiveSerializer<SendMessageDto> {
  @override
  final Iterable<Type> types = const [SendMessageDto, _$SendMessageDto];

  @override
  final String wireName = r'SendMessageDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SendMessageDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'email';
    yield serializers.serialize(
      object.email,
      specifiedType: const FullType(String),
    );
    yield r'message';
    yield serializers.serialize(
      object.message,
      specifiedType: const FullType(String),
    );
    if (object.calendarIds != null) {
      yield r'calendarIds';
      yield serializers.serialize(
        object.calendarIds,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.schoolId != null) {
      yield r'schoolId';
      yield serializers.serialize(
        object.schoolId,
        specifiedType: const FullType(String),
      );
    }
    if (object.schoolName != null) {
      yield r'schoolName';
      yield serializers.serialize(
        object.schoolName,
        specifiedType: const FullType(String),
      );
    }
    if (object.gradeName != null) {
      yield r'gradeName';
      yield serializers.serialize(
        object.gradeName,
        specifiedType: const FullType(String),
      );
    }
    if (object.deviceInfo != null) {
      yield r'deviceInfo';
      yield serializers.serialize(
        object.deviceInfo,
        specifiedType: const FullType(String),
      );
    }
    if (object.calendarUrl != null) {
      yield r'calendarUrl';
      yield serializers.serialize(
        object.calendarUrl,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    SendMessageDto object, {
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
    required SendMessageDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'email':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.email = valueDes;
          break;
        case r'message':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.message = valueDes;
          break;
        case r'calendarIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.calendarIds.replace(valueDes);
          break;
        case r'schoolId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.schoolId = valueDes;
          break;
        case r'schoolName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.schoolName = valueDes;
          break;
        case r'gradeName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.gradeName = valueDes;
          break;
        case r'deviceInfo':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.deviceInfo = valueDes;
          break;
        case r'calendarUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.calendarUrl = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SendMessageDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SendMessageDtoBuilder();
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
