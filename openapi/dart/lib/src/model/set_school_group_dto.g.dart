// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'set_school_group_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SetSchoolGroupDto extends SetSchoolGroupDto {
  @override
  final BuiltList<SchoolGroupItem> groups;
  @override
  final String icalUrl;

  factory _$SetSchoolGroupDto(
          [void Function(SetSchoolGroupDtoBuilder)? updates]) =>
      (new SetSchoolGroupDtoBuilder()..update(updates))._build();

  _$SetSchoolGroupDto._({required this.groups, required this.icalUrl})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        groups, r'SetSchoolGroupDto', 'groups');
    BuiltValueNullFieldError.checkNotNull(
        icalUrl, r'SetSchoolGroupDto', 'icalUrl');
  }

  @override
  SetSchoolGroupDto rebuild(void Function(SetSchoolGroupDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SetSchoolGroupDtoBuilder toBuilder() =>
      new SetSchoolGroupDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SetSchoolGroupDto &&
        groups == other.groups &&
        icalUrl == other.icalUrl;
  }

  @override
  int get hashCode {
    return $jf($jc($jc(0, groups.hashCode), icalUrl.hashCode));
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SetSchoolGroupDto')
          ..add('groups', groups)
          ..add('icalUrl', icalUrl))
        .toString();
  }
}

class SetSchoolGroupDtoBuilder
    implements Builder<SetSchoolGroupDto, SetSchoolGroupDtoBuilder> {
  _$SetSchoolGroupDto? _$v;

  ListBuilder<SchoolGroupItem>? _groups;
  ListBuilder<SchoolGroupItem> get groups =>
      _$this._groups ??= new ListBuilder<SchoolGroupItem>();
  set groups(ListBuilder<SchoolGroupItem>? groups) => _$this._groups = groups;

  String? _icalUrl;
  String? get icalUrl => _$this._icalUrl;
  set icalUrl(String? icalUrl) => _$this._icalUrl = icalUrl;

  SetSchoolGroupDtoBuilder() {
    SetSchoolGroupDto._defaults(this);
  }

  SetSchoolGroupDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _groups = $v.groups.toBuilder();
      _icalUrl = $v.icalUrl;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SetSchoolGroupDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$SetSchoolGroupDto;
  }

  @override
  void update(void Function(SetSchoolGroupDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SetSchoolGroupDto build() => _build();

  _$SetSchoolGroupDto _build() {
    _$SetSchoolGroupDto _$result;
    try {
      _$result = _$v ??
          new _$SetSchoolGroupDto._(
              groups: groups.build(),
              icalUrl: BuiltValueNullFieldError.checkNotNull(
                  icalUrl, r'SetSchoolGroupDto', 'icalUrl'));
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'groups';
        groups.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'SetSchoolGroupDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: always_put_control_body_on_new_line,always_specify_types,annotate_overrides,avoid_annotating_with_dynamic,avoid_as,avoid_catches_without_on_clauses,avoid_returning_this,deprecated_member_use_from_same_package,lines_longer_than_80_chars,no_leading_underscores_for_local_identifiers,omit_local_variable_types,prefer_expression_function_bodies,sort_constructors_first,test_types_in_equals,unnecessary_const,unnecessary_new,unnecessary_lambdas
