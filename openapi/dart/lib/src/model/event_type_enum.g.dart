// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'event_type_enum.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const EventTypeEnum _$cm = const EventTypeEnum._('cm');
const EventTypeEnum _$td = const EventTypeEnum._('td');
const EventTypeEnum _$tp = const EventTypeEnum._('tp');
const EventTypeEnum _$tp2 = const EventTypeEnum._('tp2');
const EventTypeEnum _$project = const EventTypeEnum._('project');
const EventTypeEnum _$exam = const EventTypeEnum._('exam');
const EventTypeEnum _$class_ = const EventTypeEnum._('class_');

EventTypeEnum _$valueOf(String name) {
  switch (name) {
    case 'cm':
      return _$cm;
    case 'td':
      return _$td;
    case 'tp':
      return _$tp;
    case 'tp2':
      return _$tp2;
    case 'project':
      return _$project;
    case 'exam':
      return _$exam;
    case 'class_':
      return _$class_;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<EventTypeEnum> _$values =
    new BuiltSet<EventTypeEnum>(const <EventTypeEnum>[
  _$cm,
  _$td,
  _$tp,
  _$tp2,
  _$project,
  _$exam,
  _$class_,
]);

class _$EventTypeEnumMeta {
  const _$EventTypeEnumMeta();
  EventTypeEnum get cm => _$cm;
  EventTypeEnum get td => _$td;
  EventTypeEnum get tp => _$tp;
  EventTypeEnum get tp2 => _$tp2;
  EventTypeEnum get project => _$project;
  EventTypeEnum get exam => _$exam;
  EventTypeEnum get class_ => _$class_;
  EventTypeEnum valueOf(String name) => _$valueOf(name);
  BuiltSet<EventTypeEnum> get values => _$values;
}

abstract class _$EventTypeEnumMixin {
  // ignore: non_constant_identifier_names
  _$EventTypeEnumMeta get EventTypeEnum => const _$EventTypeEnumMeta();
}

Serializer<EventTypeEnum> _$eventTypeEnumSerializer =
    new _$EventTypeEnumSerializer();

class _$EventTypeEnumSerializer implements PrimitiveSerializer<EventTypeEnum> {
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
  final Iterable<Type> types = const <Type>[EventTypeEnum];
  @override
  final String wireName = 'EventTypeEnum';

  @override
  Object serialize(Serializers serializers, EventTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  EventTypeEnum deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      EventTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
