// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'calendar_for_public.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CalendarForPublic extends CalendarForPublic {
  @override
  final String id;
  @override
  final String token;
  @override
  final String name;
  @override
  final String? schoolName;
  @override
  final String? schoolId;
  @override
  final DateTime lastUpdatedAt;
  @override
  final DateTime createdAt;

  factory _$CalendarForPublic(
          [void Function(CalendarForPublicBuilder)? updates]) =>
      (new CalendarForPublicBuilder()..update(updates))._build();

  _$CalendarForPublic._(
      {required this.id,
      required this.token,
      required this.name,
      this.schoolName,
      this.schoolId,
      required this.lastUpdatedAt,
      required this.createdAt})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(id, r'CalendarForPublic', 'id');
    BuiltValueNullFieldError.checkNotNull(token, r'CalendarForPublic', 'token');
    BuiltValueNullFieldError.checkNotNull(name, r'CalendarForPublic', 'name');
    BuiltValueNullFieldError.checkNotNull(
        lastUpdatedAt, r'CalendarForPublic', 'lastUpdatedAt');
    BuiltValueNullFieldError.checkNotNull(
        createdAt, r'CalendarForPublic', 'createdAt');
  }

  @override
  CalendarForPublic rebuild(void Function(CalendarForPublicBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CalendarForPublicBuilder toBuilder() =>
      new CalendarForPublicBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CalendarForPublic &&
        id == other.id &&
        token == other.token &&
        name == other.name &&
        schoolName == other.schoolName &&
        schoolId == other.schoolId &&
        lastUpdatedAt == other.lastUpdatedAt &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, token.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, schoolName.hashCode);
    _$hash = $jc(_$hash, schoolId.hashCode);
    _$hash = $jc(_$hash, lastUpdatedAt.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CalendarForPublic')
          ..add('id', id)
          ..add('token', token)
          ..add('name', name)
          ..add('schoolName', schoolName)
          ..add('schoolId', schoolId)
          ..add('lastUpdatedAt', lastUpdatedAt)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class CalendarForPublicBuilder
    implements Builder<CalendarForPublic, CalendarForPublicBuilder> {
  _$CalendarForPublic? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _token;
  String? get token => _$this._token;
  set token(String? token) => _$this._token = token;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _schoolName;
  String? get schoolName => _$this._schoolName;
  set schoolName(String? schoolName) => _$this._schoolName = schoolName;

  String? _schoolId;
  String? get schoolId => _$this._schoolId;
  set schoolId(String? schoolId) => _$this._schoolId = schoolId;

  DateTime? _lastUpdatedAt;
  DateTime? get lastUpdatedAt => _$this._lastUpdatedAt;
  set lastUpdatedAt(DateTime? lastUpdatedAt) =>
      _$this._lastUpdatedAt = lastUpdatedAt;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  CalendarForPublicBuilder() {
    CalendarForPublic._defaults(this);
  }

  CalendarForPublicBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _token = $v.token;
      _name = $v.name;
      _schoolName = $v.schoolName;
      _schoolId = $v.schoolId;
      _lastUpdatedAt = $v.lastUpdatedAt;
      _createdAt = $v.createdAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CalendarForPublic other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$CalendarForPublic;
  }

  @override
  void update(void Function(CalendarForPublicBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CalendarForPublic build() => _build();

  _$CalendarForPublic _build() {
    final _$result = _$v ??
        new _$CalendarForPublic._(
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'CalendarForPublic', 'id'),
            token: BuiltValueNullFieldError.checkNotNull(
                token, r'CalendarForPublic', 'token'),
            name: BuiltValueNullFieldError.checkNotNull(
                name, r'CalendarForPublic', 'name'),
            schoolName: schoolName,
            schoolId: schoolId,
            lastUpdatedAt: BuiltValueNullFieldError.checkNotNull(
                lastUpdatedAt, r'CalendarForPublic', 'lastUpdatedAt'),
            createdAt: BuiltValueNullFieldError.checkNotNull(
                createdAt, r'CalendarForPublic', 'createdAt'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
