// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sync_calendars_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SyncCalendarsDto extends SyncCalendarsDto {
  @override
  final BuiltList<String> tokens;

  factory _$SyncCalendarsDto(
          [void Function(SyncCalendarsDtoBuilder)? updates]) =>
      (new SyncCalendarsDtoBuilder()..update(updates))._build();

  _$SyncCalendarsDto._({required this.tokens}) : super._() {
    BuiltValueNullFieldError.checkNotNull(
        tokens, r'SyncCalendarsDto', 'tokens');
  }

  @override
  SyncCalendarsDto rebuild(void Function(SyncCalendarsDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SyncCalendarsDtoBuilder toBuilder() =>
      new SyncCalendarsDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SyncCalendarsDto && tokens == other.tokens;
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
    return (newBuiltValueToStringHelper(r'SyncCalendarsDto')
          ..add('tokens', tokens))
        .toString();
  }
}

class SyncCalendarsDtoBuilder
    implements Builder<SyncCalendarsDto, SyncCalendarsDtoBuilder> {
  _$SyncCalendarsDto? _$v;

  ListBuilder<String>? _tokens;
  ListBuilder<String> get tokens =>
      _$this._tokens ??= new ListBuilder<String>();
  set tokens(ListBuilder<String>? tokens) => _$this._tokens = tokens;

  SyncCalendarsDtoBuilder() {
    SyncCalendarsDto._defaults(this);
  }

  SyncCalendarsDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _tokens = $v.tokens.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SyncCalendarsDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$SyncCalendarsDto;
  }

  @override
  void update(void Function(SyncCalendarsDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SyncCalendarsDto build() => _build();

  _$SyncCalendarsDto _build() {
    _$SyncCalendarsDto _$result;
    try {
      _$result = _$v ?? new _$SyncCalendarsDto._(tokens: tokens.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'tokens';
        tokens.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'SyncCalendarsDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
