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
      (GetSchoolGroupsIcalUrlRepDtoBuilder()..update(updates))._build();

  _$GetSchoolGroupsIcalUrlRepDto._({required this.url}) : super._();
  @override
  GetSchoolGroupsIcalUrlRepDto rebuild(
          void Function(GetSchoolGroupsIcalUrlRepDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  GetSchoolGroupsIcalUrlRepDtoBuilder toBuilder() =>
      GetSchoolGroupsIcalUrlRepDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is GetSchoolGroupsIcalUrlRepDto && url == other.url;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, url.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
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
        _$GetSchoolGroupsIcalUrlRepDto._(
          url: BuiltValueNullFieldError.checkNotNull(
              url, r'GetSchoolGroupsIcalUrlRepDto', 'url'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
