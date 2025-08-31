// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'calendar_change_get.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CalendarChangeGet extends CalendarChangeGet {
  @override
  final BuiltList<CalendarLogEventGet> oldItems;
  @override
  final BuiltList<CalendarLogEventGet> newItems;
  @override
  final BuiltList<String> changedItems;

  factory _$CalendarChangeGet(
          [void Function(CalendarChangeGetBuilder)? updates]) =>
      (CalendarChangeGetBuilder()..update(updates))._build();

  _$CalendarChangeGet._(
      {required this.oldItems,
      required this.newItems,
      required this.changedItems})
      : super._();
  @override
  CalendarChangeGet rebuild(void Function(CalendarChangeGetBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CalendarChangeGetBuilder toBuilder() =>
      CalendarChangeGetBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CalendarChangeGet &&
        oldItems == other.oldItems &&
        newItems == other.newItems &&
        changedItems == other.changedItems;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, oldItems.hashCode);
    _$hash = $jc(_$hash, newItems.hashCode);
    _$hash = $jc(_$hash, changedItems.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CalendarChangeGet')
          ..add('oldItems', oldItems)
          ..add('newItems', newItems)
          ..add('changedItems', changedItems))
        .toString();
  }
}

class CalendarChangeGetBuilder
    implements Builder<CalendarChangeGet, CalendarChangeGetBuilder> {
  _$CalendarChangeGet? _$v;

  ListBuilder<CalendarLogEventGet>? _oldItems;
  ListBuilder<CalendarLogEventGet> get oldItems =>
      _$this._oldItems ??= ListBuilder<CalendarLogEventGet>();
  set oldItems(ListBuilder<CalendarLogEventGet>? oldItems) =>
      _$this._oldItems = oldItems;

  ListBuilder<CalendarLogEventGet>? _newItems;
  ListBuilder<CalendarLogEventGet> get newItems =>
      _$this._newItems ??= ListBuilder<CalendarLogEventGet>();
  set newItems(ListBuilder<CalendarLogEventGet>? newItems) =>
      _$this._newItems = newItems;

  ListBuilder<String>? _changedItems;
  ListBuilder<String> get changedItems =>
      _$this._changedItems ??= ListBuilder<String>();
  set changedItems(ListBuilder<String>? changedItems) =>
      _$this._changedItems = changedItems;

  CalendarChangeGetBuilder() {
    CalendarChangeGet._defaults(this);
  }

  CalendarChangeGetBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _oldItems = $v.oldItems.toBuilder();
      _newItems = $v.newItems.toBuilder();
      _changedItems = $v.changedItems.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CalendarChangeGet other) {
    _$v = other as _$CalendarChangeGet;
  }

  @override
  void update(void Function(CalendarChangeGetBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CalendarChangeGet build() => _build();

  _$CalendarChangeGet _build() {
    _$CalendarChangeGet _$result;
    try {
      _$result = _$v ??
          _$CalendarChangeGet._(
            oldItems: oldItems.build(),
            newItems: newItems.build(),
            changedItems: changedItems.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'oldItems';
        oldItems.build();
        _$failedField = 'newItems';
        newItems.build();
        _$failedField = 'changedItems';
        changedItems.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'CalendarChangeGet', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
