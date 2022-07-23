// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'calendar_with_content.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CalendarWithContent extends CalendarWithContent {
  @override
  final CalendarForPublic calendar;
  @override
  final BuiltList<CalendarEventForPublic> events;

  factory _$CalendarWithContent(
          [void Function(CalendarWithContentBuilder)? updates]) =>
      (new CalendarWithContentBuilder()..update(updates))._build();

  _$CalendarWithContent._({required this.calendar, required this.events})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        calendar, r'CalendarWithContent', 'calendar');
    BuiltValueNullFieldError.checkNotNull(
        events, r'CalendarWithContent', 'events');
  }

  @override
  CalendarWithContent rebuild(
          void Function(CalendarWithContentBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CalendarWithContentBuilder toBuilder() =>
      new CalendarWithContentBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CalendarWithContent &&
        calendar == other.calendar &&
        events == other.events;
  }

  @override
  int get hashCode {
    return $jf($jc($jc(0, calendar.hashCode), events.hashCode));
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CalendarWithContent')
          ..add('calendar', calendar)
          ..add('events', events))
        .toString();
  }
}

class CalendarWithContentBuilder
    implements Builder<CalendarWithContent, CalendarWithContentBuilder> {
  _$CalendarWithContent? _$v;

  CalendarForPublicBuilder? _calendar;
  CalendarForPublicBuilder get calendar =>
      _$this._calendar ??= new CalendarForPublicBuilder();
  set calendar(CalendarForPublicBuilder? calendar) =>
      _$this._calendar = calendar;

  ListBuilder<CalendarEventForPublic>? _events;
  ListBuilder<CalendarEventForPublic> get events =>
      _$this._events ??= new ListBuilder<CalendarEventForPublic>();
  set events(ListBuilder<CalendarEventForPublic>? events) =>
      _$this._events = events;

  CalendarWithContentBuilder() {
    CalendarWithContent._defaults(this);
  }

  CalendarWithContentBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _calendar = $v.calendar.toBuilder();
      _events = $v.events.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CalendarWithContent other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$CalendarWithContent;
  }

  @override
  void update(void Function(CalendarWithContentBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CalendarWithContent build() => _build();

  _$CalendarWithContent _build() {
    _$CalendarWithContent _$result;
    try {
      _$result = _$v ??
          new _$CalendarWithContent._(
              calendar: calendar.build(), events: events.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'calendar';
        calendar.build();
        _$failedField = 'events';
        events.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'CalendarWithContent', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: always_put_control_body_on_new_line,always_specify_types,annotate_overrides,avoid_annotating_with_dynamic,avoid_as,avoid_catches_without_on_clauses,avoid_returning_this,deprecated_member_use_from_same_package,lines_longer_than_80_chars,no_leading_underscores_for_local_identifiers,omit_local_variable_types,prefer_expression_function_bodies,sort_constructors_first,test_types_in_equals,unnecessary_const,unnecessary_new,unnecessary_lambdas
