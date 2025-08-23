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
      (CalendarWithContentBuilder()..update(updates))._build();

  _$CalendarWithContent._({required this.calendar, required this.events})
      : super._();
  @override
  CalendarWithContent rebuild(
          void Function(CalendarWithContentBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CalendarWithContentBuilder toBuilder() =>
      CalendarWithContentBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CalendarWithContent &&
        calendar == other.calendar &&
        events == other.events;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, calendar.hashCode);
    _$hash = $jc(_$hash, events.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
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
      _$this._calendar ??= CalendarForPublicBuilder();
  set calendar(CalendarForPublicBuilder? calendar) =>
      _$this._calendar = calendar;

  ListBuilder<CalendarEventForPublic>? _events;
  ListBuilder<CalendarEventForPublic> get events =>
      _$this._events ??= ListBuilder<CalendarEventForPublic>();
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
          _$CalendarWithContent._(
            calendar: calendar.build(),
            events: events.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'calendar';
        calendar.build();
        _$failedField = 'events';
        events.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'CalendarWithContent', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
