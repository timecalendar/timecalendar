// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'calendar_for_public.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CalendarForPublic extends CalendarForPublic {
  @override
  final String id;
  @override
  final String name;
  @override
  final String? schoolName;
  @override
  final String schoolId;
  @override
  final DateTime lastUpdatedAt;
  @override
  final DateTime createdAt;

  factory _$CalendarForPublic(
          [void Function(CalendarForPublicBuilder)? updates]) =>
      (new CalendarForPublicBuilder()..update(updates))._build();

  _$CalendarForPublic._(
      {required this.id,
      required this.name,
      this.schoolName,
      required this.schoolId,
      required this.lastUpdatedAt,
      required this.createdAt})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(id, r'CalendarForPublic', 'id');
    BuiltValueNullFieldError.checkNotNull(name, r'CalendarForPublic', 'name');
    BuiltValueNullFieldError.checkNotNull(
        schoolId, r'CalendarForPublic', 'schoolId');
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
        name == other.name &&
        schoolName == other.schoolName &&
        schoolId == other.schoolId &&
        lastUpdatedAt == other.lastUpdatedAt &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    return $jf($jc(
        $jc(
            $jc(
                $jc($jc($jc(0, id.hashCode), name.hashCode),
                    schoolName.hashCode),
                schoolId.hashCode),
            lastUpdatedAt.hashCode),
        createdAt.hashCode));
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CalendarForPublic')
          ..add('id', id)
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
            name: BuiltValueNullFieldError.checkNotNull(
                name, r'CalendarForPublic', 'name'),
            schoolName: schoolName,
            schoolId: BuiltValueNullFieldError.checkNotNull(
                schoolId, r'CalendarForPublic', 'schoolId'),
            lastUpdatedAt: BuiltValueNullFieldError.checkNotNull(
                lastUpdatedAt, r'CalendarForPublic', 'lastUpdatedAt'),
            createdAt: BuiltValueNullFieldError.checkNotNull(
                createdAt, r'CalendarForPublic', 'createdAt'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: always_put_control_body_on_new_line,always_specify_types,annotate_overrides,avoid_annotating_with_dynamic,avoid_as,avoid_catches_without_on_clauses,avoid_returning_this,deprecated_member_use_from_same_package,lines_longer_than_80_chars,no_leading_underscores_for_local_identifiers,omit_local_variable_types,prefer_expression_function_bodies,sort_constructors_first,test_types_in_equals,unnecessary_const,unnecessary_new,unnecessary_lambdas
