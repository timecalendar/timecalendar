// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'school_for_list.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SchoolForList extends SchoolForList {
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

  factory _$SchoolForList([void Function(SchoolForListBuilder)? updates]) =>
      (SchoolForListBuilder()..update(updates))._build();

  _$SchoolForList._(
      {required this.assistant,
      this.fallbackAssistant,
      required this.id,
      required this.code,
      required this.name,
      required this.siteUrl,
      required this.imageUrl,
      this.intranetUrl,
      required this.visible,
      required this.createdAt,
      required this.updatedAt,
      this.deletedAt})
      : super._();
  @override
  SchoolForList rebuild(void Function(SchoolForListBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SchoolForListBuilder toBuilder() => SchoolForListBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SchoolForList &&
        assistant == other.assistant &&
        fallbackAssistant == other.fallbackAssistant &&
        id == other.id &&
        code == other.code &&
        name == other.name &&
        siteUrl == other.siteUrl &&
        imageUrl == other.imageUrl &&
        intranetUrl == other.intranetUrl &&
        visible == other.visible &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt &&
        deletedAt == other.deletedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, assistant.hashCode);
    _$hash = $jc(_$hash, fallbackAssistant.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, code.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, siteUrl.hashCode);
    _$hash = $jc(_$hash, imageUrl.hashCode);
    _$hash = $jc(_$hash, intranetUrl.hashCode);
    _$hash = $jc(_$hash, visible.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jc(_$hash, deletedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SchoolForList')
          ..add('assistant', assistant)
          ..add('fallbackAssistant', fallbackAssistant)
          ..add('id', id)
          ..add('code', code)
          ..add('name', name)
          ..add('siteUrl', siteUrl)
          ..add('imageUrl', imageUrl)
          ..add('intranetUrl', intranetUrl)
          ..add('visible', visible)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt)
          ..add('deletedAt', deletedAt))
        .toString();
  }
}

class SchoolForListBuilder
    implements Builder<SchoolForList, SchoolForListBuilder> {
  _$SchoolForList? _$v;

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

  SchoolForListBuilder() {
    SchoolForList._defaults(this);
  }

  SchoolForListBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _assistant = $v.assistant.toBuilder();
      _fallbackAssistant = $v.fallbackAssistant?.toBuilder();
      _id = $v.id;
      _code = $v.code;
      _name = $v.name;
      _siteUrl = $v.siteUrl;
      _imageUrl = $v.imageUrl;
      _intranetUrl = $v.intranetUrl;
      _visible = $v.visible;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _deletedAt = $v.deletedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SchoolForList other) {
    _$v = other as _$SchoolForList;
  }

  @override
  void update(void Function(SchoolForListBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SchoolForList build() => _build();

  _$SchoolForList _build() {
    _$SchoolForList _$result;
    try {
      _$result = _$v ??
          _$SchoolForList._(
            assistant: assistant.build(),
            fallbackAssistant: _fallbackAssistant?.build(),
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'SchoolForList', 'id'),
            code: BuiltValueNullFieldError.checkNotNull(
                code, r'SchoolForList', 'code'),
            name: BuiltValueNullFieldError.checkNotNull(
                name, r'SchoolForList', 'name'),
            siteUrl: BuiltValueNullFieldError.checkNotNull(
                siteUrl, r'SchoolForList', 'siteUrl'),
            imageUrl: BuiltValueNullFieldError.checkNotNull(
                imageUrl, r'SchoolForList', 'imageUrl'),
            intranetUrl: intranetUrl,
            visible: BuiltValueNullFieldError.checkNotNull(
                visible, r'SchoolForList', 'visible'),
            createdAt: BuiltValueNullFieldError.checkNotNull(
                createdAt, r'SchoolForList', 'createdAt'),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
                updatedAt, r'SchoolForList', 'updatedAt'),
            deletedAt: deletedAt,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'assistant';
        assistant.build();
        _$failedField = 'fallbackAssistant';
        _fallbackAssistant?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SchoolForList', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
