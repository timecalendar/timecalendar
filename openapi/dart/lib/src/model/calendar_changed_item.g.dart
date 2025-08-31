// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'calendar_changed_item.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CalendarChangedItem extends CalendarChangedItem {
  @override
  final CalendarLogEventGet previousItem;
  @override
  final CalendarLogEventGet newItem;

  factory _$CalendarChangedItem(
          [void Function(CalendarChangedItemBuilder)? updates]) =>
      (CalendarChangedItemBuilder()..update(updates))._build();

  _$CalendarChangedItem._({required this.previousItem, required this.newItem})
      : super._();
  @override
  CalendarChangedItem rebuild(
          void Function(CalendarChangedItemBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CalendarChangedItemBuilder toBuilder() =>
      CalendarChangedItemBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CalendarChangedItem &&
        previousItem == other.previousItem &&
        newItem == other.newItem;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, previousItem.hashCode);
    _$hash = $jc(_$hash, newItem.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CalendarChangedItem')
          ..add('previousItem', previousItem)
          ..add('newItem', newItem))
        .toString();
  }
}

class CalendarChangedItemBuilder
    implements Builder<CalendarChangedItem, CalendarChangedItemBuilder> {
  _$CalendarChangedItem? _$v;

  CalendarLogEventGetBuilder? _previousItem;
  CalendarLogEventGetBuilder get previousItem =>
      _$this._previousItem ??= CalendarLogEventGetBuilder();
  set previousItem(CalendarLogEventGetBuilder? previousItem) =>
      _$this._previousItem = previousItem;

  CalendarLogEventGetBuilder? _newItem;
  CalendarLogEventGetBuilder get newItem =>
      _$this._newItem ??= CalendarLogEventGetBuilder();
  set newItem(CalendarLogEventGetBuilder? newItem) => _$this._newItem = newItem;

  CalendarChangedItemBuilder() {
    CalendarChangedItem._defaults(this);
  }

  CalendarChangedItemBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _previousItem = $v.previousItem.toBuilder();
      _newItem = $v.newItem.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CalendarChangedItem other) {
    _$v = other as _$CalendarChangedItem;
  }

  @override
  void update(void Function(CalendarChangedItemBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CalendarChangedItem build() => _build();

  _$CalendarChangedItem _build() {
    _$CalendarChangedItem _$result;
    try {
      _$result = _$v ??
          _$CalendarChangedItem._(
            previousItem: previousItem.build(),
            newItem: newItem.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'previousItem';
        previousItem.build();
        _$failedField = 'newItem';
        newItem.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'CalendarChangedItem', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
