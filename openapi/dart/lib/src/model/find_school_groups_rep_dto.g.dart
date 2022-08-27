// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'find_school_groups_rep_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FindSchoolGroupsRepDto extends FindSchoolGroupsRepDto {
  @override
  final BuiltList<SchoolGroupItem> groups;

  factory _$FindSchoolGroupsRepDto(
          [void Function(FindSchoolGroupsRepDtoBuilder)? updates]) =>
      (new FindSchoolGroupsRepDtoBuilder()..update(updates))._build();

  _$FindSchoolGroupsRepDto._({required this.groups}) : super._() {
    BuiltValueNullFieldError.checkNotNull(
        groups, r'FindSchoolGroupsRepDto', 'groups');
  }

  @override
  FindSchoolGroupsRepDto rebuild(
          void Function(FindSchoolGroupsRepDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  FindSchoolGroupsRepDtoBuilder toBuilder() =>
      new FindSchoolGroupsRepDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FindSchoolGroupsRepDto && groups == other.groups;
  }

  @override
  int get hashCode {
    return $jf($jc(0, groups.hashCode));
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'FindSchoolGroupsRepDto')
          ..add('groups', groups))
        .toString();
  }
}

class FindSchoolGroupsRepDtoBuilder
    implements Builder<FindSchoolGroupsRepDto, FindSchoolGroupsRepDtoBuilder> {
  _$FindSchoolGroupsRepDto? _$v;

  ListBuilder<SchoolGroupItem>? _groups;
  ListBuilder<SchoolGroupItem> get groups =>
      _$this._groups ??= new ListBuilder<SchoolGroupItem>();
  set groups(ListBuilder<SchoolGroupItem>? groups) => _$this._groups = groups;

  FindSchoolGroupsRepDtoBuilder() {
    FindSchoolGroupsRepDto._defaults(this);
  }

  FindSchoolGroupsRepDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _groups = $v.groups.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FindSchoolGroupsRepDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$FindSchoolGroupsRepDto;
  }

  @override
  void update(void Function(FindSchoolGroupsRepDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  FindSchoolGroupsRepDto build() => _build();

  _$FindSchoolGroupsRepDto _build() {
    _$FindSchoolGroupsRepDto _$result;
    try {
      _$result = _$v ?? new _$FindSchoolGroupsRepDto._(groups: groups.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'groups';
        groups.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'FindSchoolGroupsRepDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: always_put_control_body_on_new_line,always_specify_types,annotate_overrides,avoid_annotating_with_dynamic,avoid_as,avoid_catches_without_on_clauses,avoid_returning_this,deprecated_member_use_from_same_package,lines_longer_than_80_chars,no_leading_underscores_for_local_identifiers,omit_local_variable_types,prefer_expression_function_bodies,sort_constructors_first,test_types_in_equals,unnecessary_const,unnecessary_new,unnecessary_lambdas
