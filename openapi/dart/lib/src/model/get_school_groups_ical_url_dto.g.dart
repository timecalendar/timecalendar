// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'get_school_groups_ical_url_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$GetSchoolGroupsIcalUrlDto extends GetSchoolGroupsIcalUrlDto {
  @override
  final BuiltList<String> groups;

  factory _$GetSchoolGroupsIcalUrlDto(
          [void Function(GetSchoolGroupsIcalUrlDtoBuilder)? updates]) =>
      (new GetSchoolGroupsIcalUrlDtoBuilder()..update(updates))._build();

  _$GetSchoolGroupsIcalUrlDto._({required this.groups}) : super._() {
    BuiltValueNullFieldError.checkNotNull(
        groups, r'GetSchoolGroupsIcalUrlDto', 'groups');
  }

  @override
  GetSchoolGroupsIcalUrlDto rebuild(
          void Function(GetSchoolGroupsIcalUrlDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  GetSchoolGroupsIcalUrlDtoBuilder toBuilder() =>
      new GetSchoolGroupsIcalUrlDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is GetSchoolGroupsIcalUrlDto && groups == other.groups;
  }

  @override
  int get hashCode {
    return $jf($jc(0, groups.hashCode));
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'GetSchoolGroupsIcalUrlDto')
          ..add('groups', groups))
        .toString();
  }
}

class GetSchoolGroupsIcalUrlDtoBuilder
    implements
        Builder<GetSchoolGroupsIcalUrlDto, GetSchoolGroupsIcalUrlDtoBuilder> {
  _$GetSchoolGroupsIcalUrlDto? _$v;

  ListBuilder<String>? _groups;
  ListBuilder<String> get groups =>
      _$this._groups ??= new ListBuilder<String>();
  set groups(ListBuilder<String>? groups) => _$this._groups = groups;

  GetSchoolGroupsIcalUrlDtoBuilder() {
    GetSchoolGroupsIcalUrlDto._defaults(this);
  }

  GetSchoolGroupsIcalUrlDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _groups = $v.groups.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(GetSchoolGroupsIcalUrlDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$GetSchoolGroupsIcalUrlDto;
  }

  @override
  void update(void Function(GetSchoolGroupsIcalUrlDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  GetSchoolGroupsIcalUrlDto build() => _build();

  _$GetSchoolGroupsIcalUrlDto _build() {
    _$GetSchoolGroupsIcalUrlDto _$result;
    try {
      _$result =
          _$v ?? new _$GetSchoolGroupsIcalUrlDto._(groups: groups.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'groups';
        groups.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'GetSchoolGroupsIcalUrlDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: always_put_control_body_on_new_line,always_specify_types,annotate_overrides,avoid_annotating_with_dynamic,avoid_as,avoid_catches_without_on_clauses,avoid_returning_this,deprecated_member_use_from_same_package,lines_longer_than_80_chars,no_leading_underscores_for_local_identifiers,omit_local_variable_types,prefer_expression_function_bodies,sort_constructors_first,test_types_in_equals,unnecessary_const,unnecessary_new,unnecessary_lambdas
