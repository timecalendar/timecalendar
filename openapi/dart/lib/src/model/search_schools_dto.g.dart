// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'search_schools_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SearchSchoolsDto extends SearchSchoolsDto {
  @override
  final String seoUrl;

  factory _$SearchSchoolsDto(
          [void Function(SearchSchoolsDtoBuilder)? updates]) =>
      (SearchSchoolsDtoBuilder()..update(updates))._build();

  _$SearchSchoolsDto._({required this.seoUrl}) : super._();
  @override
  SearchSchoolsDto rebuild(void Function(SearchSchoolsDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SearchSchoolsDtoBuilder toBuilder() =>
      SearchSchoolsDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SearchSchoolsDto && seoUrl == other.seoUrl;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, seoUrl.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SearchSchoolsDto')
          ..add('seoUrl', seoUrl))
        .toString();
  }
}

class SearchSchoolsDtoBuilder
    implements Builder<SearchSchoolsDto, SearchSchoolsDtoBuilder> {
  _$SearchSchoolsDto? _$v;

  String? _seoUrl;
  String? get seoUrl => _$this._seoUrl;
  set seoUrl(String? seoUrl) => _$this._seoUrl = seoUrl;

  SearchSchoolsDtoBuilder() {
    SearchSchoolsDto._defaults(this);
  }

  SearchSchoolsDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _seoUrl = $v.seoUrl;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SearchSchoolsDto other) {
    _$v = other as _$SearchSchoolsDto;
  }

  @override
  void update(void Function(SearchSchoolsDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SearchSchoolsDto build() => _build();

  _$SearchSchoolsDto _build() {
    final _$result = _$v ??
        _$SearchSchoolsDto._(
          seoUrl: BuiltValueNullFieldError.checkNotNull(
              seoUrl, r'SearchSchoolsDto', 'seoUrl'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
