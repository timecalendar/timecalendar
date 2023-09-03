// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_calendar_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateCalendarDto extends CreateCalendarDto {
  @override
  final String url;
  @override
  final String? schoolId;
  @override
  final String? schoolName;
  @override
  final String? name;
  @override
  final JsonObject? customData;

  factory _$CreateCalendarDto(
          [void Function(CreateCalendarDtoBuilder)? updates]) =>
      (new CreateCalendarDtoBuilder()..update(updates))._build();

  _$CreateCalendarDto._(
      {required this.url,
      this.schoolId,
      this.schoolName,
      this.name,
      this.customData})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(url, r'CreateCalendarDto', 'url');
  }

  @override
  CreateCalendarDto rebuild(void Function(CreateCalendarDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateCalendarDtoBuilder toBuilder() =>
      new CreateCalendarDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateCalendarDto &&
        url == other.url &&
        schoolId == other.schoolId &&
        schoolName == other.schoolName &&
        name == other.name &&
        customData == other.customData;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, url.hashCode);
    _$hash = $jc(_$hash, schoolId.hashCode);
    _$hash = $jc(_$hash, schoolName.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, customData.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateCalendarDto')
          ..add('url', url)
          ..add('schoolId', schoolId)
          ..add('schoolName', schoolName)
          ..add('name', name)
          ..add('customData', customData))
        .toString();
  }
}

class CreateCalendarDtoBuilder
    implements Builder<CreateCalendarDto, CreateCalendarDtoBuilder> {
  _$CreateCalendarDto? _$v;

  String? _url;
  String? get url => _$this._url;
  set url(String? url) => _$this._url = url;

  String? _schoolId;
  String? get schoolId => _$this._schoolId;
  set schoolId(String? schoolId) => _$this._schoolId = schoolId;

  String? _schoolName;
  String? get schoolName => _$this._schoolName;
  set schoolName(String? schoolName) => _$this._schoolName = schoolName;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  JsonObject? _customData;
  JsonObject? get customData => _$this._customData;
  set customData(JsonObject? customData) => _$this._customData = customData;

  CreateCalendarDtoBuilder() {
    CreateCalendarDto._defaults(this);
  }

  CreateCalendarDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _url = $v.url;
      _schoolId = $v.schoolId;
      _schoolName = $v.schoolName;
      _name = $v.name;
      _customData = $v.customData;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateCalendarDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$CreateCalendarDto;
  }

  @override
  void update(void Function(CreateCalendarDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateCalendarDto build() => _build();

  _$CreateCalendarDto _build() {
    final _$result = _$v ??
        new _$CreateCalendarDto._(
            url: BuiltValueNullFieldError.checkNotNull(
                url, r'CreateCalendarDto', 'url'),
            schoolId: schoolId,
            schoolName: schoolName,
            name: name,
            customData: customData);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
