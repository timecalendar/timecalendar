// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'personal_event.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$PersonalEvent extends PersonalEvent {
  @override
  final String uid;
  @override
  final String title;
  @override
  final material.Color color;
  @override
  final DateTime startsAt;
  @override
  final DateTime endsAt;
  @override
  final String? location;
  @override
  final String? description;
  @override
  final DateTime exportedAt;

  factory _$PersonalEvent([void Function(PersonalEventBuilder)? updates]) =>
      (new PersonalEventBuilder()..update(updates))._build();

  _$PersonalEvent._({
    required this.uid,
    required this.title,
    required this.color,
    required this.startsAt,
    required this.endsAt,
    this.location,
    this.description,
    required this.exportedAt,
  }) : super._() {
    BuiltValueNullFieldError.checkNotNull(uid, r'PersonalEvent', 'uid');
    BuiltValueNullFieldError.checkNotNull(title, r'PersonalEvent', 'title');
    BuiltValueNullFieldError.checkNotNull(color, r'PersonalEvent', 'color');
    BuiltValueNullFieldError.checkNotNull(
      startsAt,
      r'PersonalEvent',
      'startsAt',
    );
    BuiltValueNullFieldError.checkNotNull(endsAt, r'PersonalEvent', 'endsAt');
    BuiltValueNullFieldError.checkNotNull(
      exportedAt,
      r'PersonalEvent',
      'exportedAt',
    );
  }

  @override
  PersonalEvent rebuild(void Function(PersonalEventBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PersonalEventBuilder toBuilder() => new PersonalEventBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PersonalEvent &&
        uid == other.uid &&
        title == other.title &&
        color == other.color &&
        startsAt == other.startsAt &&
        endsAt == other.endsAt &&
        location == other.location &&
        description == other.description &&
        exportedAt == other.exportedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, uid.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, color.hashCode);
    _$hash = $jc(_$hash, startsAt.hashCode);
    _$hash = $jc(_$hash, endsAt.hashCode);
    _$hash = $jc(_$hash, location.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, exportedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'PersonalEvent')
          ..add('uid', uid)
          ..add('title', title)
          ..add('color', color)
          ..add('startsAt', startsAt)
          ..add('endsAt', endsAt)
          ..add('location', location)
          ..add('description', description)
          ..add('exportedAt', exportedAt))
        .toString();
  }
}

class PersonalEventBuilder
    implements Builder<PersonalEvent, PersonalEventBuilder> {
  _$PersonalEvent? _$v;

  String? _uid;
  String? get uid => _$this._uid;
  set uid(String? uid) => _$this._uid = uid;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  material.Color? _color;
  material.Color? get color => _$this._color;
  set color(material.Color? color) => _$this._color = color;

  DateTime? _startsAt;
  DateTime? get startsAt => _$this._startsAt;
  set startsAt(DateTime? startsAt) => _$this._startsAt = startsAt;

  DateTime? _endsAt;
  DateTime? get endsAt => _$this._endsAt;
  set endsAt(DateTime? endsAt) => _$this._endsAt = endsAt;

  String? _location;
  String? get location => _$this._location;
  set location(String? location) => _$this._location = location;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  DateTime? _exportedAt;
  DateTime? get exportedAt => _$this._exportedAt;
  set exportedAt(DateTime? exportedAt) => _$this._exportedAt = exportedAt;

  PersonalEventBuilder();

  PersonalEventBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _uid = $v.uid;
      _title = $v.title;
      _color = $v.color;
      _startsAt = $v.startsAt;
      _endsAt = $v.endsAt;
      _location = $v.location;
      _description = $v.description;
      _exportedAt = $v.exportedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(PersonalEvent other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$PersonalEvent;
  }

  @override
  void update(void Function(PersonalEventBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PersonalEvent build() => _build();

  _$PersonalEvent _build() {
    final _$result =
        _$v ??
        new _$PersonalEvent._(
          uid: BuiltValueNullFieldError.checkNotNull(
            uid,
            r'PersonalEvent',
            'uid',
          ),
          title: BuiltValueNullFieldError.checkNotNull(
            title,
            r'PersonalEvent',
            'title',
          ),
          color: BuiltValueNullFieldError.checkNotNull(
            color,
            r'PersonalEvent',
            'color',
          ),
          startsAt: BuiltValueNullFieldError.checkNotNull(
            startsAt,
            r'PersonalEvent',
            'startsAt',
          ),
          endsAt: BuiltValueNullFieldError.checkNotNull(
            endsAt,
            r'PersonalEvent',
            'endsAt',
          ),
          location: location,
          description: description,
          exportedAt: BuiltValueNullFieldError.checkNotNull(
            exportedAt,
            r'PersonalEvent',
            'exportedAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
