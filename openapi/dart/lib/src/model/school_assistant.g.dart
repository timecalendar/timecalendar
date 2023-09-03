// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'school_assistant.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SchoolAssistant extends SchoolAssistant {
  @override
  final String slug;
  @override
  final bool requireIntranetAccess;
  @override
  final bool requireCalendarName;
  @override
  final bool isNative;

  factory _$SchoolAssistant([void Function(SchoolAssistantBuilder)? updates]) =>
      (new SchoolAssistantBuilder()..update(updates))._build();

  _$SchoolAssistant._(
      {required this.slug,
      required this.requireIntranetAccess,
      required this.requireCalendarName,
      required this.isNative})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(slug, r'SchoolAssistant', 'slug');
    BuiltValueNullFieldError.checkNotNull(
        requireIntranetAccess, r'SchoolAssistant', 'requireIntranetAccess');
    BuiltValueNullFieldError.checkNotNull(
        requireCalendarName, r'SchoolAssistant', 'requireCalendarName');
    BuiltValueNullFieldError.checkNotNull(
        isNative, r'SchoolAssistant', 'isNative');
  }

  @override
  SchoolAssistant rebuild(void Function(SchoolAssistantBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SchoolAssistantBuilder toBuilder() =>
      new SchoolAssistantBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SchoolAssistant &&
        slug == other.slug &&
        requireIntranetAccess == other.requireIntranetAccess &&
        requireCalendarName == other.requireCalendarName &&
        isNative == other.isNative;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, slug.hashCode);
    _$hash = $jc(_$hash, requireIntranetAccess.hashCode);
    _$hash = $jc(_$hash, requireCalendarName.hashCode);
    _$hash = $jc(_$hash, isNative.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SchoolAssistant')
          ..add('slug', slug)
          ..add('requireIntranetAccess', requireIntranetAccess)
          ..add('requireCalendarName', requireCalendarName)
          ..add('isNative', isNative))
        .toString();
  }
}

class SchoolAssistantBuilder
    implements Builder<SchoolAssistant, SchoolAssistantBuilder> {
  _$SchoolAssistant? _$v;

  String? _slug;
  String? get slug => _$this._slug;
  set slug(String? slug) => _$this._slug = slug;

  bool? _requireIntranetAccess;
  bool? get requireIntranetAccess => _$this._requireIntranetAccess;
  set requireIntranetAccess(bool? requireIntranetAccess) =>
      _$this._requireIntranetAccess = requireIntranetAccess;

  bool? _requireCalendarName;
  bool? get requireCalendarName => _$this._requireCalendarName;
  set requireCalendarName(bool? requireCalendarName) =>
      _$this._requireCalendarName = requireCalendarName;

  bool? _isNative;
  bool? get isNative => _$this._isNative;
  set isNative(bool? isNative) => _$this._isNative = isNative;

  SchoolAssistantBuilder() {
    SchoolAssistant._defaults(this);
  }

  SchoolAssistantBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _slug = $v.slug;
      _requireIntranetAccess = $v.requireIntranetAccess;
      _requireCalendarName = $v.requireCalendarName;
      _isNative = $v.isNative;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SchoolAssistant other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$SchoolAssistant;
  }

  @override
  void update(void Function(SchoolAssistantBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SchoolAssistant build() => _build();

  _$SchoolAssistant _build() {
    final _$result = _$v ??
        new _$SchoolAssistant._(
            slug: BuiltValueNullFieldError.checkNotNull(
                slug, r'SchoolAssistant', 'slug'),
            requireIntranetAccess: BuiltValueNullFieldError.checkNotNull(
                requireIntranetAccess,
                r'SchoolAssistant',
                'requireIntranetAccess'),
            requireCalendarName: BuiltValueNullFieldError.checkNotNull(
                requireCalendarName, r'SchoolAssistant', 'requireCalendarName'),
            isNative: BuiltValueNullFieldError.checkNotNull(
                isNative, r'SchoolAssistant', 'isNative'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
