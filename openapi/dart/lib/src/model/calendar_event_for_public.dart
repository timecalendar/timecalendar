//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:timecalendar_api/src/model/event_type_enum.dart';
import 'package:timecalendar_api/src/model/event_tag.dart';
import 'package:built_collection/built_collection.dart';
import 'package:timecalendar_api/src/model/calendar_event_custom_fields.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'calendar_event_for_public.g.dart';

/// CalendarEventForPublic
///
/// Properties:
/// * [type]
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
/// * [fields]
/// * [exportedAt]
@BuiltValue()
abstract class CalendarEventForPublic
    implements Built<CalendarEventForPublic, CalendarEventForPublicBuilder> {
  @BuiltValueField(wireName: r'type')
  EventTypeEnum get type;
  // enum typeEnum {  cm,  td,  tp,  tp2,  project,  exam,  class,  };

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
  BuiltList<EventTag> get tags;

  @BuiltValueField(wireName: r'fields')
  CalendarEventCustomFields? get fields;

  @BuiltValueField(wireName: r'exportedAt')
  DateTime get exportedAt;

  CalendarEventForPublic._();

  factory CalendarEventForPublic(
          [void updates(CalendarEventForPublicBuilder b)]) =
      _$CalendarEventForPublic;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CalendarEventForPublicBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CalendarEventForPublic> get serializer =>
      _$CalendarEventForPublicSerializer();
}

class _$CalendarEventForPublicSerializer
    implements PrimitiveSerializer<CalendarEventForPublic> {
  @override
  final Iterable<Type> types = const [
    CalendarEventForPublic,
    _$CalendarEventForPublic
  ];

  @override
  final String wireName = r'CalendarEventForPublic';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CalendarEventForPublic object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(EventTypeEnum),
    );
    yield r'color';
    yield serializers.serialize(
      object.color,
      specifiedType: const FullType(String),
    );
    yield r'groupColor';
    yield serializers.serialize(
      object.groupColor,
      specifiedType: const FullType(String),
    );
    yield r'uid';
    yield serializers.serialize(
      object.uid,
      specifiedType: const FullType(String),
    );
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    yield r'startsAt';
    yield serializers.serialize(
      object.startsAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'endsAt';
    yield serializers.serialize(
      object.endsAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'location';
    yield object.location == null
        ? null
        : serializers.serialize(
            object.location,
            specifiedType: const FullType.nullable(String),
          );
    yield r'allDay';
    yield serializers.serialize(
      object.allDay,
      specifiedType: const FullType(bool),
    );
    yield r'description';
    yield object.description == null
        ? null
        : serializers.serialize(
            object.description,
            specifiedType: const FullType.nullable(String),
          );
    yield r'teachers';
    yield serializers.serialize(
      object.teachers,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'tags';
    yield serializers.serialize(
      object.tags,
      specifiedType: const FullType(BuiltList, [FullType(EventTag)]),
    );
    yield r'fields';
    yield object.fields == null
        ? null
        : serializers.serialize(
            object.fields,
            specifiedType: const FullType.nullable(CalendarEventCustomFields),
          );
    yield r'exportedAt';
    yield serializers.serialize(
      object.exportedAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CalendarEventForPublic object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object,
            specifiedType: specifiedType)
        .toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CalendarEventForPublicBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(EventTypeEnum),
          ) as EventTypeEnum;
          result.type = valueDes;
          break;
        case r'color':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.color = valueDes;
          break;
        case r'groupColor':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.groupColor = valueDes;
          break;
        case r'uid':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.uid = valueDes;
          break;
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'startsAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.startsAt = valueDes;
          break;
        case r'endsAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.endsAt = valueDes;
          break;
        case r'location':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.location = valueDes;
          break;
        case r'allDay':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.allDay = valueDes;
          break;
        case r'description':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.description = valueDes;
          break;
        case r'teachers':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.teachers.replace(valueDes);
          break;
        case r'tags':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(EventTag)]),
          ) as BuiltList<EventTag>;
          result.tags.replace(valueDes);
          break;
        case r'fields':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(CalendarEventCustomFields),
          ) as CalendarEventCustomFields?;
          if (valueDes == null) continue;
          result.fields.replace(valueDes);
          break;
        case r'exportedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.exportedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CalendarEventForPublic deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CalendarEventForPublicBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}
