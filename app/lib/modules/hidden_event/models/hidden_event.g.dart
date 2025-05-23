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

  _$HiddenEvent._({
    required this.uidHiddenEvents,
    required this.namedHiddenEvents,
  }) : super._() {
    BuiltValueNullFieldError.checkNotNull(
      uidHiddenEvents,
      r'HiddenEvent',
      'uidHiddenEvents',
    );
    BuiltValueNullFieldError.checkNotNull(
      namedHiddenEvents,
      r'HiddenEvent',
      'namedHiddenEvents',
    );
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
    var _$hash = 0;
    _$hash = $jc(_$hash, uidHiddenEvents.hashCode);
    _$hash = $jc(_$hash, namedHiddenEvents.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
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
      _$result =
          _$v ??
          new _$HiddenEvent._(
            uidHiddenEvents: uidHiddenEvents.build(),
            namedHiddenEvents: namedHiddenEvents.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'uidHiddenEvents';
        uidHiddenEvents.build();
        _$failedField = 'namedHiddenEvents';
        namedHiddenEvents.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
          r'HiddenEvent',
          _$failedField,
          e.toString(),
        );
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
