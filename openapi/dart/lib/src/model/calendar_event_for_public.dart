//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'calendar_event_for_public.g.dart';

/// CalendarEventForPublic
///
/// Properties:
/// * [color]
/// * [groupColor]
/// * [uid]
/// * [title]
/// * [startsAt]
/// * [endsAt]
/// * [location]
/// * [allDay]
/// * [description]
/// * [teachers]
/// * [tags]
/// * [type]
/// * [fields]
/// * [exportedAt]
abstract class CalendarEventForPublic
    implements Built<CalendarEventForPublic, CalendarEventForPublicBuilder> {
  @BuiltValueField(wireName: r'color')
  String get color;

  @BuiltValueField(wireName: r'groupColor')
  String get groupColor;

  @BuiltValueField(wireName: r'uid')
  String get uid;

  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'startsAt')
  DateTime get startsAt;

  @BuiltValueField(wireName: r'endsAt')
  DateTime get endsAt;

  @BuiltValueField(wireName: r'location')
  String? get location;

  @BuiltValueField(wireName: r'allDay')
  bool get allDay;

  @BuiltValueField(wireName: r'description')
  String? get description;

  @BuiltValueField(wireName: r'teachers')
  BuiltList<String> get teachers;

  @BuiltValueField(wireName: r'tags')
  BuiltList<JsonObject> get tags;

  @BuiltValueField(wireName: r'type')
  CalendarEventForPublicTypeEnum get type;
  // enum typeEnum {  cm,  td,  tp,  tp2,  project,  exam,  class,  };

  @BuiltValueField(wireName: r'fields')
  JsonObject? get fields;

  @BuiltValueField(wireName: r'exportedAt')
  DateTime get exportedAt;

  CalendarEventForPublic._();

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CalendarEventForPublicBuilder b) => b;

  factory CalendarEventForPublic(
          [void updates(CalendarEventForPublicBuilder b)]) =
      _$CalendarEventForPublic;

  @BuiltValueSerializer(custom: true)
  static Serializer<CalendarEventForPublic> get serializer =>
      _$CalendarEventForPublicSerializer();
}

class _$CalendarEventForPublicSerializer
    implements StructuredSerializer<CalendarEventForPublic> {
  @override
  final Iterable<Type> types = const [
    CalendarEventForPublic,
    _$CalendarEventForPublic
  ];

  @override
  final String wireName = r'CalendarEventForPublic';

  @override
  Iterable<Object?> serialize(
      Serializers serializers, CalendarEventForPublic object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[];
    result
      ..add(r'color')
      ..add(serializers.serialize(object.color,
          specifiedType: const FullType(String)));
    result
      ..add(r'groupColor')
      ..add(serializers.serialize(object.groupColor,
          specifiedType: const FullType(String)));
    result
      ..add(r'uid')
      ..add(serializers.serialize(object.uid,
          specifiedType: const FullType(String)));
    result
      ..add(r'title')
      ..add(serializers.serialize(object.title,
          specifiedType: const FullType(String)));
    result
      ..add(r'startsAt')
      ..add(serializers.serialize(object.startsAt,
          specifiedType: const FullType(DateTime)));
    result
      ..add(r'endsAt')
      ..add(serializers.serialize(object.endsAt,
          specifiedType: const FullType(DateTime)));
    result
      ..add(r'location')
      ..add(object.location == null
          ? null
          : serializers.serialize(object.location,
              specifiedType: const FullType.nullable(String)));
    result
      ..add(r'allDay')
      ..add(serializers.serialize(object.allDay,
          specifiedType: const FullType(bool)));
    result
      ..add(r'description')
      ..add(object.description == null
          ? null
          : serializers.serialize(object.description,
              specifiedType: const FullType.nullable(String)));
    result
      ..add(r'teachers')
      ..add(serializers.serialize(object.teachers,
          specifiedType: const FullType(BuiltList, [FullType(String)])));
    result
      ..add(r'tags')
      ..add(serializers.serialize(object.tags,
          specifiedType: const FullType(BuiltList, [FullType(JsonObject)])));
    result
      ..add(r'type')
      ..add(serializers.serialize(object.type,
          specifiedType: const FullType(CalendarEventForPublicTypeEnum)));
    result
      ..add(r'fields')
      ..add(object.fields == null
          ? null
          : serializers.serialize(object.fields,
              specifiedType: const FullType.nullable(JsonObject)));
    result
      ..add(r'exportedAt')
      ..add(serializers.serialize(object.exportedAt,
          specifiedType: const FullType(DateTime)));
    return result;
  }

  @override
  CalendarEventForPublic deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = CalendarEventForPublicBuilder();

    final iterator = serialized.iterator;
    while (iterator.moveNext()) {
      final key = iterator.current as String;
      iterator.moveNext();
      final Object? value = iterator.current;

      switch (key) {
        case r'color':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.color = valueDes;
          break;
        case r'groupColor':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.groupColor = valueDes;
          break;
        case r'uid':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.uid = valueDes;
          break;
        case r'title':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.title = valueDes;
          break;
        case r'startsAt':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(DateTime)) as DateTime;
          result.startsAt = valueDes;
          break;
        case r'endsAt':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(DateTime)) as DateTime;
          result.endsAt = valueDes;
          break;
        case r'location':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType.nullable(String)) as String?;
          if (valueDes == null) continue;
          result.location = valueDes;
          break;
        case r'allDay':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(bool)) as bool;
          result.allDay = valueDes;
          break;
        case r'description':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType.nullable(String)) as String?;
          if (valueDes == null) continue;
          result.description = valueDes;
          break;
        case r'teachers':
          final valueDes = serializers.deserialize(value,
                  specifiedType: const FullType(BuiltList, [FullType(String)]))
              as BuiltList<String>;
          result.teachers.replace(valueDes);
          break;
        case r'tags':
          final valueDes = serializers.deserialize(value,
                  specifiedType:
                      const FullType(BuiltList, [FullType(JsonObject)]))
              as BuiltList<JsonObject>;
          result.tags.replace(valueDes);
          break;
        case r'type':
          final valueDes = serializers.deserialize(value,
                  specifiedType: const FullType(CalendarEventForPublicTypeEnum))
              as CalendarEventForPublicTypeEnum;
          result.type = valueDes;
          break;
        case r'fields':
          final valueDes = serializers.deserialize(value,
                  specifiedType: const FullType.nullable(JsonObject))
              as JsonObject?;
          if (valueDes == null) continue;
          result.fields = valueDes;
          break;
        case r'exportedAt':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(DateTime)) as DateTime;
          result.exportedAt = valueDes;
          break;
      }
    }
    return result.build();
  }
}

class CalendarEventForPublicTypeEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'cm')
  static const CalendarEventForPublicTypeEnum cm =
      _$calendarEventForPublicTypeEnum_cm;
  @BuiltValueEnumConst(wireName: r'td')
  static const CalendarEventForPublicTypeEnum td =
      _$calendarEventForPublicTypeEnum_td;
  @BuiltValueEnumConst(wireName: r'tp')
  static const CalendarEventForPublicTypeEnum tp =
      _$calendarEventForPublicTypeEnum_tp;
  @BuiltValueEnumConst(wireName: r'tp2')
  static const CalendarEventForPublicTypeEnum tp2 =
      _$calendarEventForPublicTypeEnum_tp2;
  @BuiltValueEnumConst(wireName: r'project')
  static const CalendarEventForPublicTypeEnum project =
      _$calendarEventForPublicTypeEnum_project;
  @BuiltValueEnumConst(wireName: r'exam')
  static const CalendarEventForPublicTypeEnum exam =
      _$calendarEventForPublicTypeEnum_exam;
  @BuiltValueEnumConst(wireName: r'class')
  static const CalendarEventForPublicTypeEnum class_ =
      _$calendarEventForPublicTypeEnum_class_;

  static Serializer<CalendarEventForPublicTypeEnum> get serializer =>
      _$calendarEventForPublicTypeEnumSerializer;

  const CalendarEventForPublicTypeEnum._(String name) : super(name);

  static BuiltSet<CalendarEventForPublicTypeEnum> get values =>
      _$calendarEventForPublicTypeEnumValues;
  static CalendarEventForPublicTypeEnum valueOf(String name) =>
      _$calendarEventForPublicTypeEnumValueOf(name);
}
