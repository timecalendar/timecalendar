// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'event_tag.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$EventTag extends EventTag {
  @override
  final String name;
  @override
  final String color;
  @override
  final String icon;

  factory _$EventTag([void Function(EventTagBuilder)? updates]) =>
      (EventTagBuilder()..update(updates))._build();

  _$EventTag._({required this.name, required this.color, required this.icon})
      : super._();
  @override
  EventTag rebuild(void Function(EventTagBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  EventTagBuilder toBuilder() => EventTagBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is EventTag &&
        name == other.name &&
        color == other.color &&
        icon == other.icon;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, color.hashCode);
    _$hash = $jc(_$hash, icon.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'EventTag')
          ..add('name', name)
          ..add('color', color)
          ..add('icon', icon))
        .toString();
  }
}

class EventTagBuilder implements Builder<EventTag, EventTagBuilder> {
  _$EventTag? _$v;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _color;
  String? get color => _$this._color;
  set color(String? color) => _$this._color = color;

  String? _icon;
  String? get icon => _$this._icon;
  set icon(String? icon) => _$this._icon = icon;

  EventTagBuilder() {
    EventTag._defaults(this);
  }

  EventTagBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _name = $v.name;
      _color = $v.color;
      _icon = $v.icon;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(EventTag other) {
    _$v = other as _$EventTag;
  }

  @override
  void update(void Function(EventTagBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  EventTag build() => _build();

  _$EventTag _build() {
    final _$result = _$v ??
        _$EventTag._(
          name:
              BuiltValueNullFieldError.checkNotNull(name, r'EventTag', 'name'),
          color: BuiltValueNullFieldError.checkNotNull(
              color, r'EventTag', 'color'),
          icon:
              BuiltValueNullFieldError.checkNotNull(icon, r'EventTag', 'icon'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
