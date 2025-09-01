//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'notification_subscription_create.g.dart';

/// NotificationSubscriptionCreate
///
/// Properties:
/// * [frequency]
/// * [nbDaysAhead]
/// * [isActive]
/// * [calendarIds]
/// * [fcmToken]
@BuiltValue()
abstract class NotificationSubscriptionCreate
    implements
        Built<NotificationSubscriptionCreate,
            NotificationSubscriptionCreateBuilder> {
  @BuiltValueField(wireName: r'frequency')
  NotificationSubscriptionCreateFrequencyEnum get frequency;
  // enum frequencyEnum {  immediately,  hourly,  daily,  };

  @BuiltValueField(wireName: r'nbDaysAhead')
  num get nbDaysAhead;

  @BuiltValueField(wireName: r'isActive')
  bool get isActive;

  @BuiltValueField(wireName: r'calendarIds')
  BuiltList<String> get calendarIds;

  @BuiltValueField(wireName: r'fcmToken')
  String get fcmToken;

  NotificationSubscriptionCreate._();

  factory NotificationSubscriptionCreate(
          [void updates(NotificationSubscriptionCreateBuilder b)]) =
      _$NotificationSubscriptionCreate;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(NotificationSubscriptionCreateBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<NotificationSubscriptionCreate> get serializer =>
      _$NotificationSubscriptionCreateSerializer();
}

class _$NotificationSubscriptionCreateSerializer
    implements PrimitiveSerializer<NotificationSubscriptionCreate> {
  @override
  final Iterable<Type> types = const [
    NotificationSubscriptionCreate,
    _$NotificationSubscriptionCreate
  ];

  @override
  final String wireName = r'NotificationSubscriptionCreate';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    NotificationSubscriptionCreate object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'frequency';
    yield serializers.serialize(
      object.frequency,
      specifiedType:
          const FullType(NotificationSubscriptionCreateFrequencyEnum),
    );
    yield r'nbDaysAhead';
    yield serializers.serialize(
      object.nbDaysAhead,
      specifiedType: const FullType(num),
    );
    yield r'isActive';
    yield serializers.serialize(
      object.isActive,
      specifiedType: const FullType(bool),
    );
    yield r'calendarIds';
    yield serializers.serialize(
      object.calendarIds,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'fcmToken';
    yield serializers.serialize(
      object.fcmToken,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    NotificationSubscriptionCreate object, {
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
    required NotificationSubscriptionCreateBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'frequency':
          final valueDes = serializers.deserialize(
            value,
            specifiedType:
                const FullType(NotificationSubscriptionCreateFrequencyEnum),
          ) as NotificationSubscriptionCreateFrequencyEnum;
          result.frequency = valueDes;
          break;
        case r'nbDaysAhead':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.nbDaysAhead = valueDes;
          break;
        case r'isActive':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isActive = valueDes;
          break;
        case r'calendarIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.calendarIds.replace(valueDes);
          break;
        case r'fcmToken':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.fcmToken = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  NotificationSubscriptionCreate deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = NotificationSubscriptionCreateBuilder();
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

class NotificationSubscriptionCreateFrequencyEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'immediately')
  static const NotificationSubscriptionCreateFrequencyEnum immediately =
      _$notificationSubscriptionCreateFrequencyEnum_immediately;
  @BuiltValueEnumConst(wireName: r'hourly')
  static const NotificationSubscriptionCreateFrequencyEnum hourly =
      _$notificationSubscriptionCreateFrequencyEnum_hourly;
  @BuiltValueEnumConst(wireName: r'daily')
  static const NotificationSubscriptionCreateFrequencyEnum daily =
      _$notificationSubscriptionCreateFrequencyEnum_daily;

  static Serializer<NotificationSubscriptionCreateFrequencyEnum>
      get serializer => _$notificationSubscriptionCreateFrequencyEnumSerializer;

  const NotificationSubscriptionCreateFrequencyEnum._(String name)
      : super(name);

  static BuiltSet<NotificationSubscriptionCreateFrequencyEnum> get values =>
      _$notificationSubscriptionCreateFrequencyEnumValues;
  static NotificationSubscriptionCreateFrequencyEnum valueOf(String name) =>
      _$notificationSubscriptionCreateFrequencyEnumValueOf(name);
}
