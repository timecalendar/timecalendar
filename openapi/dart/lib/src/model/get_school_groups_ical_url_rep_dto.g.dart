// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'get_school_groups_ical_url_rep_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$GetSchoolGroupsIcalUrlRepDto extends GetSchoolGroupsIcalUrlRepDto {
  @override
  final String url;

  factory _$GetSchoolGroupsIcalUrlRepDto(
          [void Function(GetSchoolGroupsIcalUrlRepDtoBuilder)? updates]) =>
      (new GetSchoolGroupsIcalUrlRepDtoBuilder()..update(updates))._build();

  _$GetSchoolGroupsIcalUrlRepDto._({required this.url}) : super._() {
    BuiltValueNullFieldError.checkNotNull(
        url, r'GetSchoolGroupsIcalUrlRepDto', 'url');
  }

  @override
  GetSchoolGroupsIcalUrlRepDto rebuild(
          void Function(GetSchoolGroupsIcalUrlRepDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  GetSchoolGroupsIcalUrlRepDtoBuilder toBuilder() =>
      new GetSchoolGroupsIcalUrlRepDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is GetSchoolGroupsIcalUrlRepDto && url == other.url;
  }

  @override
  int get hashCode {
    return $jf($jc(0, url.hashCode));
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'GetSchoolGroupsIcalUrlRepDto')
          ..add('url', url))
        .toString();
  }
}

class GetSchoolGroupsIcalUrlRepDtoBuilder
    implements
        Builder<GetSchoolGroupsIcalUrlRepDto,
            GetSchoolGroupsIcalUrlRepDtoBuilder> {
  _$GetSchoolGroupsIcalUrlRepDto? _$v;

  String? _url;
  String? get url => _$this._url;
  set url(String? url) => _$this._url = url;

  GetSchoolGroupsIcalUrlRepDtoBuilder() {
    GetSchoolGroupsIcalUrlRepDto._defaults(this);
  }

  GetSchoolGroupsIcalUrlRepDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _url = $v.url;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(GetSchoolGroupsIcalUrlRepDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$GetSchoolGroupsIcalUrlRepDto;
  }

  @override
  void update(void Function(GetSchoolGroupsIcalUrlRepDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  GetSchoolGroupsIcalUrlRepDto build() => _build();

  _$GetSchoolGroupsIcalUrlRepDto _build() {
    final _$result = _$v ??
        new _$GetSchoolGroupsIcalUrlRepDto._(
            url: BuiltValueNullFieldError.checkNotNull(
                url, r'GetSchoolGroupsIcalUrlRepDto', 'url'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: always_put_control_body_on_new_line,always_specify_types,annotate_overrides,avoid_annotating_with_dynamic,avoid_as,avoid_catches_without_on_clauses,avoid_returning_this,deprecated_member_use_from_same_package,lines_longer_than_80_chars,no_leading_underscores_for_local_identifiers,omit_local_variable_types,prefer_expression_function_bodies,sort_constructors_first,test_types_in_equals,unnecessary_const,unnecessary_new,unnecessary_lambdas
