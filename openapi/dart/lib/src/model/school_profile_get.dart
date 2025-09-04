//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:timecalendar_api/src/model/campus.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'school_profile_get.g.dart';

/// SchoolProfileGet
///
/// Properties:
/// * [campuses]
/// * [formations]
/// * [description]
/// * [studentCount]
/// * [domains]
/// * [excellenceTitle]
/// * [excellenceDescription]
/// * [tags]
/// * [campusLocationContext]
@BuiltValue()
abstract class SchoolProfileGet
    implements Built<SchoolProfileGet, SchoolProfileGetBuilder> {
  @BuiltValueField(wireName: r'campuses')
  BuiltList<Campus>? get campuses;

  @BuiltValueField(wireName: r'formations')
  BuiltList<String>? get formations;

  @BuiltValueField(wireName: r'description')
  String? get description;

  @BuiltValueField(wireName: r'studentCount')
  num? get studentCount;

  @BuiltValueField(wireName: r'domains')
  BuiltList<String>? get domains;

  @BuiltValueField(wireName: r'excellenceTitle')
  String? get excellenceTitle;

  @BuiltValueField(wireName: r'excellenceDescription')
  String? get excellenceDescription;

  @BuiltValueField(wireName: r'tags')
  BuiltList<String>? get tags;

  @BuiltValueField(wireName: r'campusLocationContext')
  String? get campusLocationContext;

  SchoolProfileGet._();

  factory SchoolProfileGet([void updates(SchoolProfileGetBuilder b)]) =
      _$SchoolProfileGet;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SchoolProfileGetBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SchoolProfileGet> get serializer =>
      _$SchoolProfileGetSerializer();
}

class _$SchoolProfileGetSerializer
    implements PrimitiveSerializer<SchoolProfileGet> {
  @override
  final Iterable<Type> types = const [SchoolProfileGet, _$SchoolProfileGet];

  @override
  final String wireName = r'SchoolProfileGet';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SchoolProfileGet object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.campuses != null) {
      yield r'campuses';
      yield serializers.serialize(
        object.campuses,
        specifiedType: const FullType(BuiltList, [FullType(Campus)]),
      );
    }
    if (object.formations != null) {
      yield r'formations';
      yield serializers.serialize(
        object.formations,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.description != null) {
      yield r'description';
      yield serializers.serialize(
        object.description,
        specifiedType: const FullType(String),
      );
    }
    if (object.studentCount != null) {
      yield r'studentCount';
      yield serializers.serialize(
        object.studentCount,
        specifiedType: const FullType(num),
      );
    }
    if (object.domains != null) {
      yield r'domains';
      yield serializers.serialize(
        object.domains,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.excellenceTitle != null) {
      yield r'excellenceTitle';
      yield serializers.serialize(
        object.excellenceTitle,
        specifiedType: const FullType(String),
      );
    }
    if (object.excellenceDescription != null) {
      yield r'excellenceDescription';
      yield serializers.serialize(
        object.excellenceDescription,
        specifiedType: const FullType(String),
      );
    }
    if (object.tags != null) {
      yield r'tags';
      yield serializers.serialize(
        object.tags,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.campusLocationContext != null) {
      yield r'campusLocationContext';
      yield serializers.serialize(
        object.campusLocationContext,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    SchoolProfileGet object, {
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
    required SchoolProfileGetBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'campuses':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(Campus)]),
          ) as BuiltList<Campus>;
          result.campuses.replace(valueDes);
          break;
        case r'formations':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.formations.replace(valueDes);
          break;
        case r'description':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.description = valueDes;
          break;
        case r'studentCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.studentCount = valueDes;
          break;
        case r'domains':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.domains.replace(valueDes);
          break;
        case r'excellenceTitle':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.excellenceTitle = valueDes;
          break;
        case r'excellenceDescription':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.excellenceDescription = valueDes;
          break;
        case r'tags':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.tags.replace(valueDes);
          break;
        case r'campusLocationContext':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.campusLocationContext = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SchoolProfileGet deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SchoolProfileGetBuilder();
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
