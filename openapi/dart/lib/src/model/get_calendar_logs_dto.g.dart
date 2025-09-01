// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'get_calendar_logs_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$GetCalendarLogsDto extends GetCalendarLogsDto {
  @override
  final BuiltList<String> tokens;

  factory _$GetCalendarLogsDto(
          [void Function(GetCalendarLogsDtoBuilder)? updates]) =>
      (GetCalendarLogsDtoBuilder()..update(updates))._build();

  _$GetCalendarLogsDto._({required this.tokens}) : super._();
  @override
  GetCalendarLogsDto rebuild(
          void Function(GetCalendarLogsDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  GetCalendarLogsDtoBuilder toBuilder() =>
      GetCalendarLogsDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is GetCalendarLogsDto && tokens == other.tokens;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, tokens.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'GetCalendarLogsDto')
          ..add('tokens', tokens))
        .toString();
  }
}

class GetCalendarLogsDtoBuilder
    implements Builder<GetCalendarLogsDto, GetCalendarLogsDtoBuilder> {
  _$GetCalendarLogsDto? _$v;

  ListBuilder<String>? _tokens;
  ListBuilder<String> get tokens => _$this._tokens ??= ListBuilder<String>();
  set tokens(ListBuilder<String>? tokens) => _$this._tokens = tokens;

  GetCalendarLogsDtoBuilder() {
    GetCalendarLogsDto._defaults(this);
  }

  GetCalendarLogsDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _tokens = $v.tokens.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(GetCalendarLogsDto other) {
    _$v = other as _$GetCalendarLogsDto;
  }

  @override
  void update(void Function(GetCalendarLogsDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  GetCalendarLogsDto build() => _build();

  _$GetCalendarLogsDto _build() {
    _$GetCalendarLogsDto _$result;
    try {
      _$result = _$v ??
          _$GetCalendarLogsDto._(
            tokens: tokens.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'tokens';
        tokens.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'GetCalendarLogsDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
