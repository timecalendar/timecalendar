// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notification_subscription_create.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const NotificationSubscriptionCreateFrequencyEnum
    _$notificationSubscriptionCreateFrequencyEnum_immediately =
    const NotificationSubscriptionCreateFrequencyEnum._('immediately');
const NotificationSubscriptionCreateFrequencyEnum
    _$notificationSubscriptionCreateFrequencyEnum_hourly =
    const NotificationSubscriptionCreateFrequencyEnum._('hourly');
const NotificationSubscriptionCreateFrequencyEnum
    _$notificationSubscriptionCreateFrequencyEnum_daily =
    const NotificationSubscriptionCreateFrequencyEnum._('daily');

NotificationSubscriptionCreateFrequencyEnum
    _$notificationSubscriptionCreateFrequencyEnumValueOf(String name) {
  switch (name) {
    case 'immediately':
      return _$notificationSubscriptionCreateFrequencyEnum_immediately;
    case 'hourly':
      return _$notificationSubscriptionCreateFrequencyEnum_hourly;
    case 'daily':
      return _$notificationSubscriptionCreateFrequencyEnum_daily;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<NotificationSubscriptionCreateFrequencyEnum>
    _$notificationSubscriptionCreateFrequencyEnumValues = BuiltSet<
        NotificationSubscriptionCreateFrequencyEnum>(const <NotificationSubscriptionCreateFrequencyEnum>[
  _$notificationSubscriptionCreateFrequencyEnum_immediately,
  _$notificationSubscriptionCreateFrequencyEnum_hourly,
  _$notificationSubscriptionCreateFrequencyEnum_daily,
]);

Serializer<NotificationSubscriptionCreateFrequencyEnum>
    _$notificationSubscriptionCreateFrequencyEnumSerializer =
    _$NotificationSubscriptionCreateFrequencyEnumSerializer();

class _$NotificationSubscriptionCreateFrequencyEnumSerializer
    implements
        PrimitiveSerializer<NotificationSubscriptionCreateFrequencyEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'immediately': 'immediately',
    'hourly': 'hourly',
    'daily': 'daily',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'immediately': 'immediately',
    'hourly': 'hourly',
    'daily': 'daily',
  };

  @override
  final Iterable<Type> types = const <Type>[
    NotificationSubscriptionCreateFrequencyEnum
  ];
  @override
  final String wireName = 'NotificationSubscriptionCreateFrequencyEnum';

  @override
  Object serialize(Serializers serializers,
          NotificationSubscriptionCreateFrequencyEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  NotificationSubscriptionCreateFrequencyEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      NotificationSubscriptionCreateFrequencyEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$NotificationSubscriptionCreate extends NotificationSubscriptionCreate {
  @override
  final NotificationSubscriptionCreateFrequencyEnum frequency;
  @override
  final num nbDaysAhead;
  @override
  final bool isActive;
  @override
  final BuiltList<String> calendarIds;
  @override
  final String fcmToken;

  factory _$NotificationSubscriptionCreate(
          [void Function(NotificationSubscriptionCreateBuilder)? updates]) =>
      (NotificationSubscriptionCreateBuilder()..update(updates))._build();

  _$NotificationSubscriptionCreate._(
      {required this.frequency,
      required this.nbDaysAhead,
      required this.isActive,
      required this.calendarIds,
      required this.fcmToken})
      : super._();
  @override
  NotificationSubscriptionCreate rebuild(
          void Function(NotificationSubscriptionCreateBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  NotificationSubscriptionCreateBuilder toBuilder() =>
      NotificationSubscriptionCreateBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is NotificationSubscriptionCreate &&
        frequency == other.frequency &&
        nbDaysAhead == other.nbDaysAhead &&
        isActive == other.isActive &&
        calendarIds == other.calendarIds &&
        fcmToken == other.fcmToken;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, frequency.hashCode);
    _$hash = $jc(_$hash, nbDaysAhead.hashCode);
    _$hash = $jc(_$hash, isActive.hashCode);
    _$hash = $jc(_$hash, calendarIds.hashCode);
    _$hash = $jc(_$hash, fcmToken.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'NotificationSubscriptionCreate')
          ..add('frequency', frequency)
          ..add('nbDaysAhead', nbDaysAhead)
          ..add('isActive', isActive)
          ..add('calendarIds', calendarIds)
          ..add('fcmToken', fcmToken))
        .toString();
  }
}

class NotificationSubscriptionCreateBuilder
    implements
        Builder<NotificationSubscriptionCreate,
            NotificationSubscriptionCreateBuilder> {
  _$NotificationSubscriptionCreate? _$v;

  NotificationSubscriptionCreateFrequencyEnum? _frequency;
  NotificationSubscriptionCreateFrequencyEnum? get frequency =>
      _$this._frequency;
  set frequency(NotificationSubscriptionCreateFrequencyEnum? frequency) =>
      _$this._frequency = frequency;

  num? _nbDaysAhead;
  num? get nbDaysAhead => _$this._nbDaysAhead;
  set nbDaysAhead(num? nbDaysAhead) => _$this._nbDaysAhead = nbDaysAhead;

  bool? _isActive;
  bool? get isActive => _$this._isActive;
  set isActive(bool? isActive) => _$this._isActive = isActive;

  ListBuilder<String>? _calendarIds;
  ListBuilder<String> get calendarIds =>
      _$this._calendarIds ??= ListBuilder<String>();
  set calendarIds(ListBuilder<String>? calendarIds) =>
      _$this._calendarIds = calendarIds;

  String? _fcmToken;
  String? get fcmToken => _$this._fcmToken;
  set fcmToken(String? fcmToken) => _$this._fcmToken = fcmToken;

  NotificationSubscriptionCreateBuilder() {
    NotificationSubscriptionCreate._defaults(this);
  }

  NotificationSubscriptionCreateBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _frequency = $v.frequency;
      _nbDaysAhead = $v.nbDaysAhead;
      _isActive = $v.isActive;
      _calendarIds = $v.calendarIds.toBuilder();
      _fcmToken = $v.fcmToken;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(NotificationSubscriptionCreate other) {
    _$v = other as _$NotificationSubscriptionCreate;
  }

  @override
  void update(void Function(NotificationSubscriptionCreateBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  NotificationSubscriptionCreate build() => _build();

  _$NotificationSubscriptionCreate _build() {
    _$NotificationSubscriptionCreate _$result;
    try {
      _$result = _$v ??
          _$NotificationSubscriptionCreate._(
            frequency: BuiltValueNullFieldError.checkNotNull(
                frequency, r'NotificationSubscriptionCreate', 'frequency'),
            nbDaysAhead: BuiltValueNullFieldError.checkNotNull(
                nbDaysAhead, r'NotificationSubscriptionCreate', 'nbDaysAhead'),
            isActive: BuiltValueNullFieldError.checkNotNull(
                isActive, r'NotificationSubscriptionCreate', 'isActive'),
            calendarIds: calendarIds.build(),
            fcmToken: BuiltValueNullFieldError.checkNotNull(
                fcmToken, r'NotificationSubscriptionCreate', 'fcmToken'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'calendarIds';
        calendarIds.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'NotificationSubscriptionCreate', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
