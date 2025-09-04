// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'school_for_seo.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SchoolForSeo extends SchoolForSeo {
  @override
  final SchoolAssistant assistant;
  @override
  final SchoolAssistant? fallbackAssistant;
  @override
  final String id;
  @override
  final String code;
  @override
  final String name;
  @override
  final String? seoUrl;
  @override
  final String siteUrl;
  @override
  final String imageUrl;
  @override
  final String? intranetUrl;
  @override
  final bool visible;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;
  @override
  final DateTime? deletedAt;
  @override
  final SchoolProfileGet? profile;

  factory _$SchoolForSeo([void Function(SchoolForSeoBuilder)? updates]) =>
      (SchoolForSeoBuilder()..update(updates))._build();

  _$SchoolForSeo._(
      {required this.assistant,
      this.fallbackAssistant,
      required this.id,
      required this.code,
      required this.name,
      this.seoUrl,
      required this.siteUrl,
      required this.imageUrl,
      this.intranetUrl,
      required this.visible,
      required this.createdAt,
      required this.updatedAt,
      this.deletedAt,
      this.profile})
      : super._();
  @override
  SchoolForSeo rebuild(void Function(SchoolForSeoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SchoolForSeoBuilder toBuilder() => SchoolForSeoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SchoolForSeo &&
        assistant == other.assistant &&
        fallbackAssistant == other.fallbackAssistant &&
        id == other.id &&
        code == other.code &&
        name == other.name &&
        seoUrl == other.seoUrl &&
        siteUrl == other.siteUrl &&
        imageUrl == other.imageUrl &&
        intranetUrl == other.intranetUrl &&
        visible == other.visible &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt &&
        deletedAt == other.deletedAt &&
        profile == other.profile;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, assistant.hashCode);
    _$hash = $jc(_$hash, fallbackAssistant.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, code.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, seoUrl.hashCode);
    _$hash = $jc(_$hash, siteUrl.hashCode);
    _$hash = $jc(_$hash, imageUrl.hashCode);
    _$hash = $jc(_$hash, intranetUrl.hashCode);
    _$hash = $jc(_$hash, visible.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jc(_$hash, deletedAt.hashCode);
    _$hash = $jc(_$hash, profile.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SchoolForSeo')
          ..add('assistant', assistant)
          ..add('fallbackAssistant', fallbackAssistant)
          ..add('id', id)
          ..add('code', code)
          ..add('name', name)
          ..add('seoUrl', seoUrl)
          ..add('siteUrl', siteUrl)
          ..add('imageUrl', imageUrl)
          ..add('intranetUrl', intranetUrl)
          ..add('visible', visible)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt)
          ..add('deletedAt', deletedAt)
          ..add('profile', profile))
        .toString();
  }
}

class SchoolForSeoBuilder
    implements Builder<SchoolForSeo, SchoolForSeoBuilder> {
  _$SchoolForSeo? _$v;

  SchoolAssistantBuilder? _assistant;
  SchoolAssistantBuilder get assistant =>
      _$this._assistant ??= SchoolAssistantBuilder();
  set assistant(SchoolAssistantBuilder? assistant) =>
      _$this._assistant = assistant;

  SchoolAssistantBuilder? _fallbackAssistant;
  SchoolAssistantBuilder get fallbackAssistant =>
      _$this._fallbackAssistant ??= SchoolAssistantBuilder();
  set fallbackAssistant(SchoolAssistantBuilder? fallbackAssistant) =>
      _$this._fallbackAssistant = fallbackAssistant;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _code;
  String? get code => _$this._code;
  set code(String? code) => _$this._code = code;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _seoUrl;
  String? get seoUrl => _$this._seoUrl;
  set seoUrl(String? seoUrl) => _$this._seoUrl = seoUrl;

  String? _siteUrl;
  String? get siteUrl => _$this._siteUrl;
  set siteUrl(String? siteUrl) => _$this._siteUrl = siteUrl;

  String? _imageUrl;
  String? get imageUrl => _$this._imageUrl;
  set imageUrl(String? imageUrl) => _$this._imageUrl = imageUrl;

  String? _intranetUrl;
  String? get intranetUrl => _$this._intranetUrl;
  set intranetUrl(String? intranetUrl) => _$this._intranetUrl = intranetUrl;

  bool? _visible;
  bool? get visible => _$this._visible;
  set visible(bool? visible) => _$this._visible = visible;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _updatedAt;
  DateTime? get updatedAt => _$this._updatedAt;
  set updatedAt(DateTime? updatedAt) => _$this._updatedAt = updatedAt;

  DateTime? _deletedAt;
  DateTime? get deletedAt => _$this._deletedAt;
  set deletedAt(DateTime? deletedAt) => _$this._deletedAt = deletedAt;

  SchoolProfileGetBuilder? _profile;
  SchoolProfileGetBuilder get profile =>
      _$this._profile ??= SchoolProfileGetBuilder();
  set profile(SchoolProfileGetBuilder? profile) => _$this._profile = profile;

  SchoolForSeoBuilder() {
    SchoolForSeo._defaults(this);
  }

  SchoolForSeoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _assistant = $v.assistant.toBuilder();
      _fallbackAssistant = $v.fallbackAssistant?.toBuilder();
      _id = $v.id;
      _code = $v.code;
      _name = $v.name;
      _seoUrl = $v.seoUrl;
      _siteUrl = $v.siteUrl;
      _imageUrl = $v.imageUrl;
      _intranetUrl = $v.intranetUrl;
      _visible = $v.visible;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _deletedAt = $v.deletedAt;
      _profile = $v.profile?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SchoolForSeo other) {
    _$v = other as _$SchoolForSeo;
  }

  @override
  void update(void Function(SchoolForSeoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SchoolForSeo build() => _build();

  _$SchoolForSeo _build() {
    _$SchoolForSeo _$result;
    try {
      _$result = _$v ??
          _$SchoolForSeo._(
            assistant: assistant.build(),
            fallbackAssistant: _fallbackAssistant?.build(),
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'SchoolForSeo', 'id'),
            code: BuiltValueNullFieldError.checkNotNull(
                code, r'SchoolForSeo', 'code'),
            name: BuiltValueNullFieldError.checkNotNull(
                name, r'SchoolForSeo', 'name'),
            seoUrl: seoUrl,
            siteUrl: BuiltValueNullFieldError.checkNotNull(
                siteUrl, r'SchoolForSeo', 'siteUrl'),
            imageUrl: BuiltValueNullFieldError.checkNotNull(
                imageUrl, r'SchoolForSeo', 'imageUrl'),
            intranetUrl: intranetUrl,
            visible: BuiltValueNullFieldError.checkNotNull(
                visible, r'SchoolForSeo', 'visible'),
            createdAt: BuiltValueNullFieldError.checkNotNull(
                createdAt, r'SchoolForSeo', 'createdAt'),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
                updatedAt, r'SchoolForSeo', 'updatedAt'),
            deletedAt: deletedAt,
            profile: _profile?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'assistant';
        assistant.build();
        _$failedField = 'fallbackAssistant';
        _fallbackAssistant?.build();

        _$failedField = 'profile';
        _profile?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SchoolForSeo', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
