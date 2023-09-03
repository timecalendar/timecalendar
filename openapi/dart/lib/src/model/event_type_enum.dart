//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'event_type_enum.g.dart';

class EventTypeEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'cm')
  static const EventTypeEnum cm = _$cm;
  @BuiltValueEnumConst(wireName: r'td')
  static const EventTypeEnum td = _$td;
  @BuiltValueEnumConst(wireName: r'tp')
  static const EventTypeEnum tp = _$tp;
  @BuiltValueEnumConst(wireName: r'tp2')
  static const EventTypeEnum tp2 = _$tp2;
  @BuiltValueEnumConst(wireName: r'project')
  static const EventTypeEnum project = _$project;
  @BuiltValueEnumConst(wireName: r'exam')
  static const EventTypeEnum exam = _$exam;
  @BuiltValueEnumConst(wireName: r'class')
  static const EventTypeEnum class_ = _$class_;

  static Serializer<EventTypeEnum> get serializer => _$eventTypeEnumSerializer;

  const EventTypeEnum._(String name) : super(name);

  static BuiltSet<EventTypeEnum> get values => _$values;
  static EventTypeEnum valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class EventTypeEnumMixin = Object with _$EventTypeEnumMixin;
