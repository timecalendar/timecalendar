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
      (FindSchoolGroupsRepDtoBuilder()..update(updates))._build();

  _$FindSchoolGroupsRepDto._({required this.groups}) : super._();
  @override
  FindSchoolGroupsRepDto rebuild(
          void Function(FindSchoolGroupsRepDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  FindSchoolGroupsRepDtoBuilder toBuilder() =>
      FindSchoolGroupsRepDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FindSchoolGroupsRepDto && groups == other.groups;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, groups.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
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
      _$this._groups ??= ListBuilder<SchoolGroupItem>();
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
      _$result = _$v ??
          _$FindSchoolGroupsRepDto._(
            groups: groups.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'groups';
        groups.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'FindSchoolGroupsRepDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
