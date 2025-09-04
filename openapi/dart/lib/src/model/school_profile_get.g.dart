// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'school_profile_get.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SchoolProfileGet extends SchoolProfileGet {
  @override
  final BuiltList<Campus>? campuses;
  @override
  final BuiltList<String>? formations;
  @override
  final String? description;
  @override
  final num? studentCount;
  @override
  final BuiltList<String>? domains;
  @override
  final String? excellenceTitle;
  @override
  final String? excellenceDescription;
  @override
  final BuiltList<String>? tags;
  @override
  final String? campusLocationContext;

  factory _$SchoolProfileGet(
          [void Function(SchoolProfileGetBuilder)? updates]) =>
      (SchoolProfileGetBuilder()..update(updates))._build();

  _$SchoolProfileGet._(
      {this.campuses,
      this.formations,
      this.description,
      this.studentCount,
      this.domains,
      this.excellenceTitle,
      this.excellenceDescription,
      this.tags,
      this.campusLocationContext})
      : super._();
  @override
  SchoolProfileGet rebuild(void Function(SchoolProfileGetBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SchoolProfileGetBuilder toBuilder() =>
      SchoolProfileGetBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SchoolProfileGet &&
        campuses == other.campuses &&
        formations == other.formations &&
        description == other.description &&
        studentCount == other.studentCount &&
        domains == other.domains &&
        excellenceTitle == other.excellenceTitle &&
        excellenceDescription == other.excellenceDescription &&
        tags == other.tags &&
        campusLocationContext == other.campusLocationContext;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, campuses.hashCode);
    _$hash = $jc(_$hash, formations.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, studentCount.hashCode);
    _$hash = $jc(_$hash, domains.hashCode);
    _$hash = $jc(_$hash, excellenceTitle.hashCode);
    _$hash = $jc(_$hash, excellenceDescription.hashCode);
    _$hash = $jc(_$hash, tags.hashCode);
    _$hash = $jc(_$hash, campusLocationContext.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SchoolProfileGet')
          ..add('campuses', campuses)
          ..add('formations', formations)
          ..add('description', description)
          ..add('studentCount', studentCount)
          ..add('domains', domains)
          ..add('excellenceTitle', excellenceTitle)
          ..add('excellenceDescription', excellenceDescription)
          ..add('tags', tags)
          ..add('campusLocationContext', campusLocationContext))
        .toString();
  }
}

class SchoolProfileGetBuilder
    implements Builder<SchoolProfileGet, SchoolProfileGetBuilder> {
  _$SchoolProfileGet? _$v;

  ListBuilder<Campus>? _campuses;
  ListBuilder<Campus> get campuses =>
      _$this._campuses ??= ListBuilder<Campus>();
  set campuses(ListBuilder<Campus>? campuses) => _$this._campuses = campuses;

  ListBuilder<String>? _formations;
  ListBuilder<String> get formations =>
      _$this._formations ??= ListBuilder<String>();
  set formations(ListBuilder<String>? formations) =>
      _$this._formations = formations;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  num? _studentCount;
  num? get studentCount => _$this._studentCount;
  set studentCount(num? studentCount) => _$this._studentCount = studentCount;

  ListBuilder<String>? _domains;
  ListBuilder<String> get domains => _$this._domains ??= ListBuilder<String>();
  set domains(ListBuilder<String>? domains) => _$this._domains = domains;

  String? _excellenceTitle;
  String? get excellenceTitle => _$this._excellenceTitle;
  set excellenceTitle(String? excellenceTitle) =>
      _$this._excellenceTitle = excellenceTitle;

  String? _excellenceDescription;
  String? get excellenceDescription => _$this._excellenceDescription;
  set excellenceDescription(String? excellenceDescription) =>
      _$this._excellenceDescription = excellenceDescription;

  ListBuilder<String>? _tags;
  ListBuilder<String> get tags => _$this._tags ??= ListBuilder<String>();
  set tags(ListBuilder<String>? tags) => _$this._tags = tags;

  String? _campusLocationContext;
  String? get campusLocationContext => _$this._campusLocationContext;
  set campusLocationContext(String? campusLocationContext) =>
      _$this._campusLocationContext = campusLocationContext;

  SchoolProfileGetBuilder() {
    SchoolProfileGet._defaults(this);
  }

  SchoolProfileGetBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _campuses = $v.campuses?.toBuilder();
      _formations = $v.formations?.toBuilder();
      _description = $v.description;
      _studentCount = $v.studentCount;
      _domains = $v.domains?.toBuilder();
      _excellenceTitle = $v.excellenceTitle;
      _excellenceDescription = $v.excellenceDescription;
      _tags = $v.tags?.toBuilder();
      _campusLocationContext = $v.campusLocationContext;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SchoolProfileGet other) {
    _$v = other as _$SchoolProfileGet;
  }

  @override
  void update(void Function(SchoolProfileGetBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SchoolProfileGet build() => _build();

  _$SchoolProfileGet _build() {
    _$SchoolProfileGet _$result;
    try {
      _$result = _$v ??
          _$SchoolProfileGet._(
            campuses: _campuses?.build(),
            formations: _formations?.build(),
            description: description,
            studentCount: studentCount,
            domains: _domains?.build(),
            excellenceTitle: excellenceTitle,
            excellenceDescription: excellenceDescription,
            tags: _tags?.build(),
            campusLocationContext: campusLocationContext,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'campuses';
        _campuses?.build();
        _$failedField = 'formations';
        _formations?.build();

        _$failedField = 'domains';
        _domains?.build();

        _$failedField = 'tags';
        _tags?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SchoolProfileGet', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
