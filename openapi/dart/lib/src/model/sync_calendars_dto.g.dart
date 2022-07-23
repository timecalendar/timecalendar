// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sync_calendars_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SyncCalendarsDto extends SyncCalendarsDto {
  @override
  final BuiltList<String> calendarIds;

  factory _$SyncCalendarsDto(
          [void Function(SyncCalendarsDtoBuilder)? updates]) =>
      (new SyncCalendarsDtoBuilder()..update(updates))._build();

  _$SyncCalendarsDto._({required this.calendarIds}) : super._() {
    BuiltValueNullFieldError.checkNotNull(
        calendarIds, r'SyncCalendarsDto', 'calendarIds');
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
    return other is SyncCalendarsDto && calendarIds == other.calendarIds;
  }

  @override
  int get hashCode {
    return $jf($jc(0, calendarIds.hashCode));
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SyncCalendarsDto')
          ..add('calendarIds', calendarIds))
        .toString();
  }
}

class SyncCalendarsDtoBuilder
    implements Builder<SyncCalendarsDto, SyncCalendarsDtoBuilder> {
  _$SyncCalendarsDto? _$v;

  ListBuilder<String>? _calendarIds;
  ListBuilder<String> get calendarIds =>
      _$this._calendarIds ??= new ListBuilder<String>();
  set calendarIds(ListBuilder<String>? calendarIds) =>
      _$this._calendarIds = calendarIds;

  SyncCalendarsDtoBuilder() {
    SyncCalendarsDto._defaults(this);
  }

  SyncCalendarsDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _calendarIds = $v.calendarIds.toBuilder();
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
      _$result =
          _$v ?? new _$SyncCalendarsDto._(calendarIds: calendarIds.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'calendarIds';
        calendarIds.build();
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
