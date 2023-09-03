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
    var _$hash = 0;
    _$hash = $jc(_$hash, groups.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
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

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
