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
    return $jf($jc(
        $jc($jc($jc(0, slug.hashCode), requireIntranetAccess.hashCode),
            requireCalendarName.hashCode),
        isNative.hashCode));
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

// ignore_for_file: always_put_control_body_on_new_line,always_specify_types,annotate_overrides,avoid_annotating_with_dynamic,avoid_as,avoid_catches_without_on_clauses,avoid_returning_this,deprecated_member_use_from_same_package,lines_longer_than_80_chars,no_leading_underscores_for_local_identifiers,omit_local_variable_types,prefer_expression_function_bodies,sort_constructors_first,test_types_in_equals,unnecessary_const,unnecessary_new,unnecessary_lambdas
