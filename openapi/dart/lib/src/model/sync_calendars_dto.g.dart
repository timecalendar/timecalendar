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
    return $jf($jc(0, tokens.hashCode));
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

// ignore_for_file: always_put_control_body_on_new_line,always_specify_types,annotate_overrides,avoid_annotating_with_dynamic,avoid_as,avoid_catches_without_on_clauses,avoid_returning_this,deprecated_member_use_from_same_package,lines_longer_than_80_chars,no_leading_underscores_for_local_identifiers,omit_local_variable_types,prefer_expression_function_bodies,sort_constructors_first,test_types_in_equals,unnecessary_const,unnecessary_new,unnecessary_lambdas
