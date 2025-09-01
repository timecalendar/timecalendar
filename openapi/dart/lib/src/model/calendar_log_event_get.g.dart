// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'calendar_log_event_get.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CalendarLogEventGet extends CalendarLogEventGet {
  @override
  final String uid;
  @override
  final String title;
  @override
  final DateTime startsAt;
  @override
  final DateTime endsAt;
  @override
  final String? location;

  factory _$CalendarLogEventGet(
          [void Function(CalendarLogEventGetBuilder)? updates]) =>
      (CalendarLogEventGetBuilder()..update(updates))._build();

  _$CalendarLogEventGet._(
      {required this.uid,
      required this.title,
      required this.startsAt,
      required this.endsAt,
      this.location})
      : super._();
  @override
  CalendarLogEventGet rebuild(
          void Function(CalendarLogEventGetBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CalendarLogEventGetBuilder toBuilder() =>
      CalendarLogEventGetBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CalendarLogEventGet &&
        uid == other.uid &&
        title == other.title &&
        startsAt == other.startsAt &&
        endsAt == other.endsAt &&
        location == other.location;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, uid.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, startsAt.hashCode);
    _$hash = $jc(_$hash, endsAt.hashCode);
    _$hash = $jc(_$hash, location.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CalendarLogEventGet')
          ..add('uid', uid)
          ..add('title', title)
          ..add('startsAt', startsAt)
          ..add('endsAt', endsAt)
          ..add('location', location))
        .toString();
  }
}

class CalendarLogEventGetBuilder
    implements Builder<CalendarLogEventGet, CalendarLogEventGetBuilder> {
  _$CalendarLogEventGet? _$v;

  String? _uid;
  String? get uid => _$this._uid;
  set uid(String? uid) => _$this._uid = uid;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  DateTime? _startsAt;
  DateTime? get startsAt => _$this._startsAt;
  set startsAt(DateTime? startsAt) => _$this._startsAt = startsAt;

  DateTime? _endsAt;
  DateTime? get endsAt => _$this._endsAt;
  set endsAt(DateTime? endsAt) => _$this._endsAt = endsAt;

  String? _location;
  String? get location => _$this._location;
  set location(String? location) => _$this._location = location;

  CalendarLogEventGetBuilder() {
    CalendarLogEventGet._defaults(this);
  }

  CalendarLogEventGetBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _uid = $v.uid;
      _title = $v.title;
      _startsAt = $v.startsAt;
      _endsAt = $v.endsAt;
      _location = $v.location;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CalendarLogEventGet other) {
    _$v = other as _$CalendarLogEventGet;
  }

  @override
  void update(void Function(CalendarLogEventGetBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CalendarLogEventGet build() => _build();

  _$CalendarLogEventGet _build() {
    final _$result = _$v ??
        _$CalendarLogEventGet._(
          uid: BuiltValueNullFieldError.checkNotNull(
              uid, r'CalendarLogEventGet', 'uid'),
          title: BuiltValueNullFieldError.checkNotNull(
              title, r'CalendarLogEventGet', 'title'),
          startsAt: BuiltValueNullFieldError.checkNotNull(
              startsAt, r'CalendarLogEventGet', 'startsAt'),
          endsAt: BuiltValueNullFieldError.checkNotNull(
              endsAt, r'CalendarLogEventGet', 'endsAt'),
          location: location,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
