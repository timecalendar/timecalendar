// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target

part of 'school.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more informations: https://github.com/rrousselGit/freezed#custom-getters-and-methods');

School _$SchoolFromJson(Map<String, dynamic> json) {
  return _School.fromJson(json);
}

/// @nodoc
class _$SchoolTearOff {
  const _$SchoolTearOff();

  _School call(
      {required String code,
      required String name,
      required String siteUrl,
      required String imageUrl,
      required bool visible,
      required String? intranetUrl,
      required SchoolAssistant assistant,
      required SchoolAssistant? fallbackAssistant}) {
    return _School(
      code: code,
      name: name,
      siteUrl: siteUrl,
      imageUrl: imageUrl,
      visible: visible,
      intranetUrl: intranetUrl,
      assistant: assistant,
      fallbackAssistant: fallbackAssistant,
    );
  }

  School fromJson(Map<String, Object?> json) {
    return School.fromJson(json);
  }
}

/// @nodoc
const $School = _$SchoolTearOff();

/// @nodoc
mixin _$School {
  String get code => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get siteUrl => throw _privateConstructorUsedError;
  String get imageUrl => throw _privateConstructorUsedError;
  bool get visible => throw _privateConstructorUsedError;
  String? get intranetUrl => throw _privateConstructorUsedError;
  SchoolAssistant get assistant => throw _privateConstructorUsedError;
  SchoolAssistant? get fallbackAssistant => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $SchoolCopyWith<School> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SchoolCopyWith<$Res> {
  factory $SchoolCopyWith(School value, $Res Function(School) then) =
      _$SchoolCopyWithImpl<$Res>;
  $Res call(
      {String code,
      String name,
      String siteUrl,
      String imageUrl,
      bool visible,
      String? intranetUrl,
      SchoolAssistant assistant,
      SchoolAssistant? fallbackAssistant});

  $SchoolAssistantCopyWith<$Res> get assistant;
  $SchoolAssistantCopyWith<$Res>? get fallbackAssistant;
}

/// @nodoc
class _$SchoolCopyWithImpl<$Res> implements $SchoolCopyWith<$Res> {
  _$SchoolCopyWithImpl(this._value, this._then);

  final School _value;
  // ignore: unused_field
  final $Res Function(School) _then;

  @override
  $Res call({
    Object? code = freezed,
    Object? name = freezed,
    Object? siteUrl = freezed,
    Object? imageUrl = freezed,
    Object? visible = freezed,
    Object? intranetUrl = freezed,
    Object? assistant = freezed,
    Object? fallbackAssistant = freezed,
  }) {
    return _then(_value.copyWith(
      code: code == freezed
          ? _value.code
          : code // ignore: cast_nullable_to_non_nullable
              as String,
      name: name == freezed
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      siteUrl: siteUrl == freezed
          ? _value.siteUrl
          : siteUrl // ignore: cast_nullable_to_non_nullable
              as String,
      imageUrl: imageUrl == freezed
          ? _value.imageUrl
          : imageUrl // ignore: cast_nullable_to_non_nullable
              as String,
      visible: visible == freezed
          ? _value.visible
          : visible // ignore: cast_nullable_to_non_nullable
              as bool,
      intranetUrl: intranetUrl == freezed
          ? _value.intranetUrl
          : intranetUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      assistant: assistant == freezed
          ? _value.assistant
          : assistant // ignore: cast_nullable_to_non_nullable
              as SchoolAssistant,
      fallbackAssistant: fallbackAssistant == freezed
          ? _value.fallbackAssistant
          : fallbackAssistant // ignore: cast_nullable_to_non_nullable
              as SchoolAssistant?,
    ));
  }

  @override
  $SchoolAssistantCopyWith<$Res> get assistant {
    return $SchoolAssistantCopyWith<$Res>(_value.assistant, (value) {
      return _then(_value.copyWith(assistant: value));
    });
  }

  @override
  $SchoolAssistantCopyWith<$Res>? get fallbackAssistant {
    if (_value.fallbackAssistant == null) {
      return null;
    }

    return $SchoolAssistantCopyWith<$Res>(_value.fallbackAssistant!, (value) {
      return _then(_value.copyWith(fallbackAssistant: value));
    });
  }
}

/// @nodoc
abstract class _$SchoolCopyWith<$Res> implements $SchoolCopyWith<$Res> {
  factory _$SchoolCopyWith(_School value, $Res Function(_School) then) =
      __$SchoolCopyWithImpl<$Res>;
  @override
  $Res call(
      {String code,
      String name,
      String siteUrl,
      String imageUrl,
      bool visible,
      String? intranetUrl,
      SchoolAssistant assistant,
      SchoolAssistant? fallbackAssistant});

  @override
  $SchoolAssistantCopyWith<$Res> get assistant;
  @override
  $SchoolAssistantCopyWith<$Res>? get fallbackAssistant;
}

/// @nodoc
class __$SchoolCopyWithImpl<$Res> extends _$SchoolCopyWithImpl<$Res>
    implements _$SchoolCopyWith<$Res> {
  __$SchoolCopyWithImpl(_School _value, $Res Function(_School) _then)
      : super(_value, (v) => _then(v as _School));

  @override
  _School get _value => super._value as _School;

  @override
  $Res call({
    Object? code = freezed,
    Object? name = freezed,
    Object? siteUrl = freezed,
    Object? imageUrl = freezed,
    Object? visible = freezed,
    Object? intranetUrl = freezed,
    Object? assistant = freezed,
    Object? fallbackAssistant = freezed,
  }) {
    return _then(_School(
      code: code == freezed
          ? _value.code
          : code // ignore: cast_nullable_to_non_nullable
              as String,
      name: name == freezed
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      siteUrl: siteUrl == freezed
          ? _value.siteUrl
          : siteUrl // ignore: cast_nullable_to_non_nullable
              as String,
      imageUrl: imageUrl == freezed
          ? _value.imageUrl
          : imageUrl // ignore: cast_nullable_to_non_nullable
              as String,
      visible: visible == freezed
          ? _value.visible
          : visible // ignore: cast_nullable_to_non_nullable
              as bool,
      intranetUrl: intranetUrl == freezed
          ? _value.intranetUrl
          : intranetUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      assistant: assistant == freezed
          ? _value.assistant
          : assistant // ignore: cast_nullable_to_non_nullable
              as SchoolAssistant,
      fallbackAssistant: fallbackAssistant == freezed
          ? _value.fallbackAssistant
          : fallbackAssistant // ignore: cast_nullable_to_non_nullable
              as SchoolAssistant?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$_School extends _School {
  _$_School(
      {required this.code,
      required this.name,
      required this.siteUrl,
      required this.imageUrl,
      required this.visible,
      required this.intranetUrl,
      required this.assistant,
      required this.fallbackAssistant})
      : super._();

  factory _$_School.fromJson(Map<String, dynamic> json) =>
      _$$_SchoolFromJson(json);

  @override
  final String code;
  @override
  final String name;
  @override
  final String siteUrl;
  @override
  final String imageUrl;
  @override
  final bool visible;
  @override
  final String? intranetUrl;
  @override
  final SchoolAssistant assistant;
  @override
  final SchoolAssistant? fallbackAssistant;

  @override
  bool operator ==(dynamic other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _School &&
            const DeepCollectionEquality().equals(other.code, code) &&
            const DeepCollectionEquality().equals(other.name, name) &&
            const DeepCollectionEquality().equals(other.siteUrl, siteUrl) &&
            const DeepCollectionEquality().equals(other.imageUrl, imageUrl) &&
            const DeepCollectionEquality().equals(other.visible, visible) &&
            const DeepCollectionEquality()
                .equals(other.intranetUrl, intranetUrl) &&
            const DeepCollectionEquality().equals(other.assistant, assistant) &&
            const DeepCollectionEquality()
                .equals(other.fallbackAssistant, fallbackAssistant));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      const DeepCollectionEquality().hash(code),
      const DeepCollectionEquality().hash(name),
      const DeepCollectionEquality().hash(siteUrl),
      const DeepCollectionEquality().hash(imageUrl),
      const DeepCollectionEquality().hash(visible),
      const DeepCollectionEquality().hash(intranetUrl),
      const DeepCollectionEquality().hash(assistant),
      const DeepCollectionEquality().hash(fallbackAssistant));

  @JsonKey(ignore: true)
  @override
  _$SchoolCopyWith<_School> get copyWith =>
      __$SchoolCopyWithImpl<_School>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$_SchoolToJson(this);
  }
}

abstract class _School extends School {
  factory _School(
      {required String code,
      required String name,
      required String siteUrl,
      required String imageUrl,
      required bool visible,
      required String? intranetUrl,
      required SchoolAssistant assistant,
      required SchoolAssistant? fallbackAssistant}) = _$_School;
  _School._() : super._();

  factory _School.fromJson(Map<String, dynamic> json) = _$_School.fromJson;

  @override
  String get code;
  @override
  String get name;
  @override
  String get siteUrl;
  @override
  String get imageUrl;
  @override
  bool get visible;
  @override
  String? get intranetUrl;
  @override
  SchoolAssistant get assistant;
  @override
  SchoolAssistant? get fallbackAssistant;
  @override
  @JsonKey(ignore: true)
  _$SchoolCopyWith<_School> get copyWith => throw _privateConstructorUsedError;
}
