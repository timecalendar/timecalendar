// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'hidden_event.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$HiddenEvent extends HiddenEvent {
  @override
  final BuiltList<String> uidHiddenEvents;
  @override
  final BuiltList<String> namedHiddenEvents;

  factory _$HiddenEvent([void Function(HiddenEventBuilder)? updates]) =>
      (new HiddenEventBuilder()..update(updates))._build();

  _$HiddenEvent._(
      {required this.uidHiddenEvents, required this.namedHiddenEvents})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        uidHiddenEvents, r'HiddenEvent', 'uidHiddenEvents');
    BuiltValueNullFieldError.checkNotNull(
        namedHiddenEvents, r'HiddenEvent', 'namedHiddenEvents');
  }

  @override
  HiddenEvent rebuild(void Function(HiddenEventBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  HiddenEventBuilder toBuilder() => new HiddenEventBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is HiddenEvent &&
        uidHiddenEvents == other.uidHiddenEvents &&
        namedHiddenEvents == other.namedHiddenEvents;
  }

  @override
  int get hashCode {
    return $jf(
        $jc($jc(0, uidHiddenEvents.hashCode), namedHiddenEvents.hashCode));
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'HiddenEvent')
          ..add('uidHiddenEvents', uidHiddenEvents)
          ..add('namedHiddenEvents', namedHiddenEvents))
        .toString();
  }
}

class HiddenEventBuilder implements Builder<HiddenEvent, HiddenEventBuilder> {
  _$HiddenEvent? _$v;

  ListBuilder<String>? _uidHiddenEvents;
  ListBuilder<String> get uidHiddenEvents =>
      _$this._uidHiddenEvents ??= new ListBuilder<String>();
  set uidHiddenEvents(ListBuilder<String>? uidHiddenEvents) =>
      _$this._uidHiddenEvents = uidHiddenEvents;

  ListBuilder<String>? _namedHiddenEvents;
  ListBuilder<String> get namedHiddenEvents =>
      _$this._namedHiddenEvents ??= new ListBuilder<String>();
  set namedHiddenEvents(ListBuilder<String>? namedHiddenEvents) =>
      _$this._namedHiddenEvents = namedHiddenEvents;

  HiddenEventBuilder();

  HiddenEventBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _uidHiddenEvents = $v.uidHiddenEvents.toBuilder();
      _namedHiddenEvents = $v.namedHiddenEvents.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(HiddenEvent other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$HiddenEvent;
  }

  @override
  void update(void Function(HiddenEventBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  HiddenEvent build() => _build();

  _$HiddenEvent _build() {
    _$HiddenEvent _$result;
    try {
      _$result = _$v ??
          new _$HiddenEvent._(
              uidHiddenEvents: uidHiddenEvents.build(),
              namedHiddenEvents: namedHiddenEvents.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'uidHiddenEvents';
        uidHiddenEvents.build();
        _$failedField = 'namedHiddenEvents';
        namedHiddenEvents.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'HiddenEvent', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: always_put_control_body_on_new_line,always_specify_types,annotate_overrides,avoid_annotating_with_dynamic,avoid_as,avoid_catches_without_on_clauses,avoid_returning_this,deprecated_member_use_from_same_package,lines_longer_than_80_chars,no_leading_underscores_for_local_identifiers,omit_local_variable_types,prefer_expression_function_bodies,sort_constructors_first,test_types_in_equals,unnecessary_const,unnecessary_new,unnecessary_lambdas
