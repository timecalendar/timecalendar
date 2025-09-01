// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'school_group_item.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SchoolGroupItem extends SchoolGroupItem {
  @override
  final String text;
  @override
  final String value;
  @override
  final BuiltList<SchoolGroupItem> children;

  factory _$SchoolGroupItem([void Function(SchoolGroupItemBuilder)? updates]) =>
      (SchoolGroupItemBuilder()..update(updates))._build();

  _$SchoolGroupItem._(
      {required this.text, required this.value, required this.children})
      : super._();
  @override
  SchoolGroupItem rebuild(void Function(SchoolGroupItemBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SchoolGroupItemBuilder toBuilder() => SchoolGroupItemBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SchoolGroupItem &&
        text == other.text &&
        value == other.value &&
        children == other.children;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, text.hashCode);
    _$hash = $jc(_$hash, value.hashCode);
    _$hash = $jc(_$hash, children.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SchoolGroupItem')
          ..add('text', text)
          ..add('value', value)
          ..add('children', children))
        .toString();
  }
}

class SchoolGroupItemBuilder
    implements Builder<SchoolGroupItem, SchoolGroupItemBuilder> {
  _$SchoolGroupItem? _$v;

  String? _text;
  String? get text => _$this._text;
  set text(String? text) => _$this._text = text;

  String? _value;
  String? get value => _$this._value;
  set value(String? value) => _$this._value = value;

  ListBuilder<SchoolGroupItem>? _children;
  ListBuilder<SchoolGroupItem> get children =>
      _$this._children ??= ListBuilder<SchoolGroupItem>();
  set children(ListBuilder<SchoolGroupItem>? children) =>
      _$this._children = children;

  SchoolGroupItemBuilder() {
    SchoolGroupItem._defaults(this);
  }

  SchoolGroupItemBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _text = $v.text;
      _value = $v.value;
      _children = $v.children.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SchoolGroupItem other) {
    _$v = other as _$SchoolGroupItem;
  }

  @override
  void update(void Function(SchoolGroupItemBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SchoolGroupItem build() => _build();

  _$SchoolGroupItem _build() {
    _$SchoolGroupItem _$result;
    try {
      _$result = _$v ??
          _$SchoolGroupItem._(
            text: BuiltValueNullFieldError.checkNotNull(
                text, r'SchoolGroupItem', 'text'),
            value: BuiltValueNullFieldError.checkNotNull(
                value, r'SchoolGroupItem', 'value'),
            children: children.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'children';
        children.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SchoolGroupItem', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
