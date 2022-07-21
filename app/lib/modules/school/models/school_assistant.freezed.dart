// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target

part of 'school_assistant.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more informations: https://github.com/rrousselGit/freezed#custom-getters-and-methods');

SchoolAssistant _$SchoolAssistantFromJson(Map<String, dynamic> json) {
  return _SchoolAssistant.fromJson(json);
}

/// @nodoc
class _$SchoolAssistantTearOff {
  const _$SchoolAssistantTearOff();

  _SchoolAssistant call(
      {required String slug,
      required bool isNative,
      required bool requireIntranetAccess,
      required bool requireCalendarName}) {
    return _SchoolAssistant(
      slug: slug,
      isNative: isNative,
      requireIntranetAccess: requireIntranetAccess,
      requireCalendarName: requireCalendarName,
    );
  }

  SchoolAssistant fromJson(Map<String, Object?> json) {
    return SchoolAssistant.fromJson(json);
  }
}

/// @nodoc
const $SchoolAssistant = _$SchoolAssistantTearOff();

/// @nodoc
mixin _$SchoolAssistant {
  String get slug => throw _privateConstructorUsedError;
  bool get isNative => throw _privateConstructorUsedError;
  bool get requireIntranetAccess => throw _privateConstructorUsedError;
  bool get requireCalendarName => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $SchoolAssistantCopyWith<SchoolAssistant> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SchoolAssistantCopyWith<$Res> {
  factory $SchoolAssistantCopyWith(
          SchoolAssistant value, $Res Function(SchoolAssistant) then) =
      _$SchoolAssistantCopyWithImpl<$Res>;
  $Res call(
      {String slug,
      bool isNative,
      bool requireIntranetAccess,
      bool requireCalendarName});
}

/// @nodoc
class _$SchoolAssistantCopyWithImpl<$Res>
    implements $SchoolAssistantCopyWith<$Res> {
  _$SchoolAssistantCopyWithImpl(this._value, this._then);

  final SchoolAssistant _value;
  // ignore: unused_field
  final $Res Function(SchoolAssistant) _then;

  @override
  $Res call({
    Object? slug = freezed,
    Object? isNative = freezed,
    Object? requireIntranetAccess = freezed,
    Object? requireCalendarName = freezed,
  }) {
    return _then(_value.copyWith(
      slug: slug == freezed
          ? _value.slug
          : slug // ignore: cast_nullable_to_non_nullable
              as String,
      isNative: isNative == freezed
          ? _value.isNative
          : isNative // ignore: cast_nullable_to_non_nullable
              as bool,
      requireIntranetAccess: requireIntranetAccess == freezed
          ? _value.requireIntranetAccess
          : requireIntranetAccess // ignore: cast_nullable_to_non_nullable
              as bool,
      requireCalendarName: requireCalendarName == freezed
          ? _value.requireCalendarName
          : requireCalendarName // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc
abstract class _$SchoolAssistantCopyWith<$Res>
    implements $SchoolAssistantCopyWith<$Res> {
  factory _$SchoolAssistantCopyWith(
          _SchoolAssistant value, $Res Function(_SchoolAssistant) then) =
      __$SchoolAssistantCopyWithImpl<$Res>;
  @override
  $Res call(
      {String slug,
      bool isNative,
      bool requireIntranetAccess,
      bool requireCalendarName});
}

/// @nodoc
class __$SchoolAssistantCopyWithImpl<$Res>
    extends _$SchoolAssistantCopyWithImpl<$Res>
    implements _$SchoolAssistantCopyWith<$Res> {
  __$SchoolAssistantCopyWithImpl(
      _SchoolAssistant _value, $Res Function(_SchoolAssistant) _then)
      : super(_value, (v) => _then(v as _SchoolAssistant));

  @override
  _SchoolAssistant get _value => super._value as _SchoolAssistant;

  @override
  $Res call({
    Object? slug = freezed,
    Object? isNative = freezed,
    Object? requireIntranetAccess = freezed,
    Object? requireCalendarName = freezed,
  }) {
    return _then(_SchoolAssistant(
      slug: slug == freezed
          ? _value.slug
          : slug // ignore: cast_nullable_to_non_nullable
              as String,
      isNative: isNative == freezed
          ? _value.isNative
          : isNative // ignore: cast_nullable_to_non_nullable
              as bool,
      requireIntranetAccess: requireIntranetAccess == freezed
          ? _value.requireIntranetAccess
          : requireIntranetAccess // ignore: cast_nullable_to_non_nullable
              as bool,
      requireCalendarName: requireCalendarName == freezed
          ? _value.requireCalendarName
          : requireCalendarName // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$_SchoolAssistant implements _SchoolAssistant {
  _$_SchoolAssistant(
      {required this.slug,
      required this.isNative,
      required this.requireIntranetAccess,
      required this.requireCalendarName});

  factory _$_SchoolAssistant.fromJson(Map<String, dynamic> json) =>
      _$$_SchoolAssistantFromJson(json);

  @override
  final String slug;
  @override
  final bool isNative;
  @override
  final bool requireIntranetAccess;
  @override
  final bool requireCalendarName;

  @override
  String toString() {
    return 'SchoolAssistant(slug: $slug, isNative: $isNative, requireIntranetAccess: $requireIntranetAccess, requireCalendarName: $requireCalendarName)';
  }

  @override
  bool operator ==(dynamic other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _SchoolAssistant &&
            const DeepCollectionEquality().equals(other.slug, slug) &&
            const DeepCollectionEquality().equals(other.isNative, isNative) &&
            const DeepCollectionEquality()
                .equals(other.requireIntranetAccess, requireIntranetAccess) &&
            const DeepCollectionEquality()
                .equals(other.requireCalendarName, requireCalendarName));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      const DeepCollectionEquality().hash(slug),
      const DeepCollectionEquality().hash(isNative),
      const DeepCollectionEquality().hash(requireIntranetAccess),
      const DeepCollectionEquality().hash(requireCalendarName));

  @JsonKey(ignore: true)
  @override
  _$SchoolAssistantCopyWith<_SchoolAssistant> get copyWith =>
      __$SchoolAssistantCopyWithImpl<_SchoolAssistant>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$_SchoolAssistantToJson(this);
  }
}

abstract class _SchoolAssistant implements SchoolAssistant {
  factory _SchoolAssistant(
      {required String slug,
      required bool isNative,
      required bool requireIntranetAccess,
      required bool requireCalendarName}) = _$_SchoolAssistant;

  factory _SchoolAssistant.fromJson(Map<String, dynamic> json) =
      _$_SchoolAssistant.fromJson;

  @override
  String get slug;
  @override
  bool get isNative;
  @override
  bool get requireIntranetAccess;
  @override
  bool get requireCalendarName;
  @override
  @JsonKey(ignore: true)
  _$SchoolAssistantCopyWith<_SchoolAssistant> get copyWith =>
      throw _privateConstructorUsedError;
}
