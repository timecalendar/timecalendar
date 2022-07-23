// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'calendar_event_for_public.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const CalendarEventForPublicTypeEnum _$calendarEventForPublicTypeEnum_cm =
    const CalendarEventForPublicTypeEnum._('cm');
const CalendarEventForPublicTypeEnum _$calendarEventForPublicTypeEnum_td =
    const CalendarEventForPublicTypeEnum._('td');
const CalendarEventForPublicTypeEnum _$calendarEventForPublicTypeEnum_tp =
    const CalendarEventForPublicTypeEnum._('tp');
const CalendarEventForPublicTypeEnum _$calendarEventForPublicTypeEnum_tp2 =
    const CalendarEventForPublicTypeEnum._('tp2');
const CalendarEventForPublicTypeEnum _$calendarEventForPublicTypeEnum_project =
    const CalendarEventForPublicTypeEnum._('project');
const CalendarEventForPublicTypeEnum _$calendarEventForPublicTypeEnum_exam =
    const CalendarEventForPublicTypeEnum._('exam');
const CalendarEventForPublicTypeEnum _$calendarEventForPublicTypeEnum_class_ =
    const CalendarEventForPublicTypeEnum._('class_');

CalendarEventForPublicTypeEnum _$calendarEventForPublicTypeEnumValueOf(
    String name) {
  switch (name) {
    case 'cm':
      return _$calendarEventForPublicTypeEnum_cm;
    case 'td':
      return _$calendarEventForPublicTypeEnum_td;
    case 'tp':
      return _$calendarEventForPublicTypeEnum_tp;
    case 'tp2':
      return _$calendarEventForPublicTypeEnum_tp2;
    case 'project':
      return _$calendarEventForPublicTypeEnum_project;
    case 'exam':
      return _$calendarEventForPublicTypeEnum_exam;
    case 'class_':
      return _$calendarEventForPublicTypeEnum_class_;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<CalendarEventForPublicTypeEnum>
    _$calendarEventForPublicTypeEnumValues = new BuiltSet<
        CalendarEventForPublicTypeEnum>(const <CalendarEventForPublicTypeEnum>[
  _$calendarEventForPublicTypeEnum_cm,
  _$calendarEventForPublicTypeEnum_td,
  _$calendarEventForPublicTypeEnum_tp,
  _$calendarEventForPublicTypeEnum_tp2,
  _$calendarEventForPublicTypeEnum_project,
  _$calendarEventForPublicTypeEnum_exam,
  _$calendarEventForPublicTypeEnum_class_,
]);

Serializer<CalendarEventForPublicTypeEnum>
    _$calendarEventForPublicTypeEnumSerializer =
    new _$CalendarEventForPublicTypeEnumSerializer();

class _$CalendarEventForPublicTypeEnumSerializer
    implements PrimitiveSerializer<CalendarEventForPublicTypeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'cm': 'cm',
    'td': 'td',
    'tp': 'tp',
    'tp2': 'tp2',
    'project': 'project',
    'exam': 'exam',
    'class_': 'class',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'cm': 'cm',
    'td': 'td',
    'tp': 'tp',
    'tp2': 'tp2',
    'project': 'project',
    'exam': 'exam',
    'class': 'class_',
  };

  @override
  final Iterable<Type> types = const <Type>[CalendarEventForPublicTypeEnum];
  @override
  final String wireName = 'CalendarEventForPublicTypeEnum';

  @override
  Object serialize(
          Serializers serializers, CalendarEventForPublicTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  CalendarEventForPublicTypeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      CalendarEventForPublicTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$CalendarEventForPublic extends CalendarEventForPublic {
  @override
  final String color;
  @override
  final String groupColor;
  @override
  final String uid;
  @override
  final String title;
  @override
  final DateTime startsAt;
  @override
  final DateTime endsAt;
  @override
  final String? location;
  @override
  final bool allDay;
  @override
  final String? description;
  @override
  final BuiltList<String> teachers;
  @override
  final BuiltList<JsonObject> tags;
  @override
  final CalendarEventForPublicTypeEnum type;
  @override
  final JsonObject? fields;
  @override
  final DateTime exportedAt;

  factory _$CalendarEventForPublic(
          [void Function(CalendarEventForPublicBuilder)? updates]) =>
      (new CalendarEventForPublicBuilder()..update(updates))._build();

  _$CalendarEventForPublic._(
      {required this.color,
      required this.groupColor,
      required this.uid,
      required this.title,
      required this.startsAt,
      required this.endsAt,
      this.location,
      required this.allDay,
      this.description,
      required this.teachers,
      required this.tags,
      required this.type,
      this.fields,
      required this.exportedAt})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        color, r'CalendarEventForPublic', 'color');
    BuiltValueNullFieldError.checkNotNull(
        groupColor, r'CalendarEventForPublic', 'groupColor');
    BuiltValueNullFieldError.checkNotNull(
        uid, r'CalendarEventForPublic', 'uid');
    BuiltValueNullFieldError.checkNotNull(
        title, r'CalendarEventForPublic', 'title');
    BuiltValueNullFieldError.checkNotNull(
        startsAt, r'CalendarEventForPublic', 'startsAt');
    BuiltValueNullFieldError.checkNotNull(
        endsAt, r'CalendarEventForPublic', 'endsAt');
    BuiltValueNullFieldError.checkNotNull(
        allDay, r'CalendarEventForPublic', 'allDay');
    BuiltValueNullFieldError.checkNotNull(
        teachers, r'CalendarEventForPublic', 'teachers');
    BuiltValueNullFieldError.checkNotNull(
        tags, r'CalendarEventForPublic', 'tags');
    BuiltValueNullFieldError.checkNotNull(
        type, r'CalendarEventForPublic', 'type');
    BuiltValueNullFieldError.checkNotNull(
        exportedAt, r'CalendarEventForPublic', 'exportedAt');
  }

  @override
  CalendarEventForPublic rebuild(
          void Function(CalendarEventForPublicBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CalendarEventForPublicBuilder toBuilder() =>
      new CalendarEventForPublicBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CalendarEventForPublic &&
        color == other.color &&
        groupColor == other.groupColor &&
        uid == other.uid &&
        title == other.title &&
        startsAt == other.startsAt &&
        endsAt == other.endsAt &&
        location == other.location &&
        allDay == other.allDay &&
        description == other.description &&
        teachers == other.teachers &&
        tags == other.tags &&
        type == other.type &&
        fields == other.fields &&
        exportedAt == other.exportedAt;
  }

  @override
  int get hashCode {
    return $jf($jc(
        $jc(
            $jc(
                $jc(
                    $jc(
                        $jc(
                            $jc(
                                $jc(
                                    $jc(
                                        $jc(
                                            $jc(
                                                $jc(
                                                    $jc($jc(0, color.hashCode),
                                                        groupColor.hashCode),
                                                    uid.hashCode),
                                                title.hashCode),
                                            startsAt.hashCode),
                                        endsAt.hashCode),
                                    location.hashCode),
                                allDay.hashCode),
                            description.hashCode),
                        teachers.hashCode),
                    tags.hashCode),
                type.hashCode),
            fields.hashCode),
        exportedAt.hashCode));
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CalendarEventForPublic')
          ..add('color', color)
          ..add('groupColor', groupColor)
          ..add('uid', uid)
          ..add('title', title)
          ..add('startsAt', startsAt)
          ..add('endsAt', endsAt)
          ..add('location', location)
          ..add('allDay', allDay)
          ..add('description', description)
          ..add('teachers', teachers)
          ..add('tags', tags)
          ..add('type', type)
          ..add('fields', fields)
          ..add('exportedAt', exportedAt))
        .toString();
  }
}

class CalendarEventForPublicBuilder
    implements Builder<CalendarEventForPublic, CalendarEventForPublicBuilder> {
  _$CalendarEventForPublic? _$v;

  String? _color;
  String? get color => _$this._color;
  set color(String? color) => _$this._color = color;

  String? _groupColor;
  String? get groupColor => _$this._groupColor;
  set groupColor(String? groupColor) => _$this._groupColor = groupColor;

  String? _uid;
  String? get uid => _$this._uid;
  set uid(String? uid) => _$this._uid = uid;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  DateTime? _startsAt;
  DateTime? get startsAt => _$this._startsAt;
  set startsAt(DateTime? startsAt) => _$this._startsAt = startsAt;

  DateTime? _endsAt;
  DateTime? get endsAt => _$this._endsAt;
  set endsAt(DateTime? endsAt) => _$this._endsAt = endsAt;

  String? _location;
  String? get location => _$this._location;
  set location(String? location) => _$this._location = location;

  bool? _allDay;
  bool? get allDay => _$this._allDay;
  set allDay(bool? allDay) => _$this._allDay = allDay;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  ListBuilder<String>? _teachers;
  ListBuilder<String> get teachers =>
      _$this._teachers ??= new ListBuilder<String>();
  set teachers(ListBuilder<String>? teachers) => _$this._teachers = teachers;

  ListBuilder<JsonObject>? _tags;
  ListBuilder<JsonObject> get tags =>
      _$this._tags ??= new ListBuilder<JsonObject>();
  set tags(ListBuilder<JsonObject>? tags) => _$this._tags = tags;

  CalendarEventForPublicTypeEnum? _type;
  CalendarEventForPublicTypeEnum? get type => _$this._type;
  set type(CalendarEventForPublicTypeEnum? type) => _$this._type = type;

  JsonObject? _fields;
  JsonObject? get fields => _$this._fields;
  set fields(JsonObject? fields) => _$this._fields = fields;

  DateTime? _exportedAt;
  DateTime? get exportedAt => _$this._exportedAt;
  set exportedAt(DateTime? exportedAt) => _$this._exportedAt = exportedAt;

  CalendarEventForPublicBuilder() {
    CalendarEventForPublic._defaults(this);
  }

  CalendarEventForPublicBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _color = $v.color;
      _groupColor = $v.groupColor;
      _uid = $v.uid;
      _title = $v.title;
      _startsAt = $v.startsAt;
      _endsAt = $v.endsAt;
      _location = $v.location;
      _allDay = $v.allDay;
      _description = $v.description;
      _teachers = $v.teachers.toBuilder();
      _tags = $v.tags.toBuilder();
      _type = $v.type;
      _fields = $v.fields;
      _exportedAt = $v.exportedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CalendarEventForPublic other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$CalendarEventForPublic;
  }

  @override
  void update(void Function(CalendarEventForPublicBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CalendarEventForPublic build() => _build();

  _$CalendarEventForPublic _build() {
    _$CalendarEventForPublic _$result;
    try {
      _$result = _$v ??
          new _$CalendarEventForPublic._(
              color: BuiltValueNullFieldError.checkNotNull(
                  color, r'CalendarEventForPublic', 'color'),
              groupColor: BuiltValueNullFieldError.checkNotNull(
                  groupColor, r'CalendarEventForPublic', 'groupColor'),
              uid: BuiltValueNullFieldError.checkNotNull(
                  uid, r'CalendarEventForPublic', 'uid'),
              title: BuiltValueNullFieldError.checkNotNull(
                  title, r'CalendarEventForPublic', 'title'),
              startsAt: BuiltValueNullFieldError.checkNotNull(
                  startsAt, r'CalendarEventForPublic', 'startsAt'),
              endsAt: BuiltValueNullFieldError.checkNotNull(
                  endsAt, r'CalendarEventForPublic', 'endsAt'),
              location: location,
              allDay: BuiltValueNullFieldError.checkNotNull(
                  allDay, r'CalendarEventForPublic', 'allDay'),
              description: description,
              teachers: teachers.build(),
              tags: tags.build(),
              type: BuiltValueNullFieldError.checkNotNull(
                  type, r'CalendarEventForPublic', 'type'),
              fields: fields,
              exportedAt:
                  BuiltValueNullFieldError.checkNotNull(exportedAt, r'CalendarEventForPublic', 'exportedAt'));
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'teachers';
        teachers.build();
        _$failedField = 'tags';
        tags.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'CalendarEventForPublic', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: always_put_control_body_on_new_line,always_specify_types,annotate_overrides,avoid_annotating_with_dynamic,avoid_as,avoid_catches_without_on_clauses,avoid_returning_this,deprecated_member_use_from_same_package,lines_longer_than_80_chars,no_leading_underscores_for_local_identifiers,omit_local_variable_types,prefer_expression_function_bodies,sort_constructors_first,test_types_in_equals,unnecessary_const,unnecessary_new,unnecessary_lambdas
