// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'calendar_log_get.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CalendarLogGet extends CalendarLogGet {
  @override
  final String id;
  @override
  final String calendarId;
  @override
  final String calendarToken;
  @override
  final String calendarName;
  @override
  final CalendarChangeGet calendarChange;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;

  factory _$CalendarLogGet([void Function(CalendarLogGetBuilder)? updates]) =>
      (CalendarLogGetBuilder()..update(updates))._build();

  _$CalendarLogGet._(
      {required this.id,
      required this.calendarId,
      required this.calendarToken,
      required this.calendarName,
      required this.calendarChange,
      required this.createdAt,
      required this.updatedAt})
      : super._();
  @override
  CalendarLogGet rebuild(void Function(CalendarLogGetBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CalendarLogGetBuilder toBuilder() => CalendarLogGetBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CalendarLogGet &&
        id == other.id &&
        calendarId == other.calendarId &&
        calendarToken == other.calendarToken &&
        calendarName == other.calendarName &&
        calendarChange == other.calendarChange &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, calendarId.hashCode);
    _$hash = $jc(_$hash, calendarToken.hashCode);
    _$hash = $jc(_$hash, calendarName.hashCode);
    _$hash = $jc(_$hash, calendarChange.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CalendarLogGet')
          ..add('id', id)
          ..add('calendarId', calendarId)
          ..add('calendarToken', calendarToken)
          ..add('calendarName', calendarName)
          ..add('calendarChange', calendarChange)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class CalendarLogGetBuilder
    implements Builder<CalendarLogGet, CalendarLogGetBuilder> {
  _$CalendarLogGet? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _calendarId;
  String? get calendarId => _$this._calendarId;
  set calendarId(String? calendarId) => _$this._calendarId = calendarId;

  String? _calendarToken;
  String? get calendarToken => _$this._calendarToken;
  set calendarToken(String? calendarToken) =>
      _$this._calendarToken = calendarToken;

  String? _calendarName;
  String? get calendarName => _$this._calendarName;
  set calendarName(String? calendarName) => _$this._calendarName = calendarName;

  CalendarChangeGetBuilder? _calendarChange;
  CalendarChangeGetBuilder get calendarChange =>
      _$this._calendarChange ??= CalendarChangeGetBuilder();
  set calendarChange(CalendarChangeGetBuilder? calendarChange) =>
      _$this._calendarChange = calendarChange;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _updatedAt;
  DateTime? get updatedAt => _$this._updatedAt;
  set updatedAt(DateTime? updatedAt) => _$this._updatedAt = updatedAt;

  CalendarLogGetBuilder() {
    CalendarLogGet._defaults(this);
  }

  CalendarLogGetBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _calendarId = $v.calendarId;
      _calendarToken = $v.calendarToken;
      _calendarName = $v.calendarName;
      _calendarChange = $v.calendarChange.toBuilder();
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CalendarLogGet other) {
    _$v = other as _$CalendarLogGet;
  }

  @override
  void update(void Function(CalendarLogGetBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CalendarLogGet build() => _build();

  _$CalendarLogGet _build() {
    _$CalendarLogGet _$result;
    try {
      _$result = _$v ??
          _$CalendarLogGet._(
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'CalendarLogGet', 'id'),
            calendarId: BuiltValueNullFieldError.checkNotNull(
                calendarId, r'CalendarLogGet', 'calendarId'),
            calendarToken: BuiltValueNullFieldError.checkNotNull(
                calendarToken, r'CalendarLogGet', 'calendarToken'),
            calendarName: BuiltValueNullFieldError.checkNotNull(
                calendarName, r'CalendarLogGet', 'calendarName'),
            calendarChange: calendarChange.build(),
            createdAt: BuiltValueNullFieldError.checkNotNull(
                createdAt, r'CalendarLogGet', 'createdAt'),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
                updatedAt, r'CalendarLogGet', 'updatedAt'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'calendarChange';
        calendarChange.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'CalendarLogGet', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
