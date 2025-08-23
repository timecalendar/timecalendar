// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_calendar_rep_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateCalendarRepDto extends CreateCalendarRepDto {
  @override
  final String token;

  factory _$CreateCalendarRepDto(
          [void Function(CreateCalendarRepDtoBuilder)? updates]) =>
      (CreateCalendarRepDtoBuilder()..update(updates))._build();

  _$CreateCalendarRepDto._({required this.token}) : super._();
  @override
  CreateCalendarRepDto rebuild(
          void Function(CreateCalendarRepDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateCalendarRepDtoBuilder toBuilder() =>
      CreateCalendarRepDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateCalendarRepDto && token == other.token;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, token.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateCalendarRepDto')
          ..add('token', token))
        .toString();
  }
}

class CreateCalendarRepDtoBuilder
    implements Builder<CreateCalendarRepDto, CreateCalendarRepDtoBuilder> {
  _$CreateCalendarRepDto? _$v;

  String? _token;
  String? get token => _$this._token;
  set token(String? token) => _$this._token = token;

  CreateCalendarRepDtoBuilder() {
    CreateCalendarRepDto._defaults(this);
  }

  CreateCalendarRepDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _token = $v.token;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateCalendarRepDto other) {
    _$v = other as _$CreateCalendarRepDto;
  }

  @override
  void update(void Function(CreateCalendarRepDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateCalendarRepDto build() => _build();

  _$CreateCalendarRepDto _build() {
    final _$result = _$v ??
        _$CreateCalendarRepDto._(
          token: BuiltValueNullFieldError.checkNotNull(
              token, r'CreateCalendarRepDto', 'token'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
