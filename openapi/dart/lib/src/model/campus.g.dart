// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'campus.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$Campus extends Campus {
  @override
  final String name;
  @override
  final String location;

  factory _$Campus([void Function(CampusBuilder)? updates]) =>
      (CampusBuilder()..update(updates))._build();

  _$Campus._({required this.name, required this.location}) : super._();
  @override
  Campus rebuild(void Function(CampusBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CampusBuilder toBuilder() => CampusBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is Campus && name == other.name && location == other.location;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, location.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'Campus')
          ..add('name', name)
          ..add('location', location))
        .toString();
  }
}

class CampusBuilder implements Builder<Campus, CampusBuilder> {
  _$Campus? _$v;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _location;
  String? get location => _$this._location;
  set location(String? location) => _$this._location = location;

  CampusBuilder() {
    Campus._defaults(this);
  }

  CampusBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _name = $v.name;
      _location = $v.location;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(Campus other) {
    _$v = other as _$Campus;
  }

  @override
  void update(void Function(CampusBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  Campus build() => _build();

  _$Campus _build() {
    final _$result = _$v ??
        _$Campus._(
          name: BuiltValueNullFieldError.checkNotNull(name, r'Campus', 'name'),
          location: BuiltValueNullFieldError.checkNotNull(
              location, r'Campus', 'location'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
