// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'assistant_state.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#custom-getters-and-methods');

/// @nodoc
mixin _$AssistantState {
  SchoolForList? get school => throw _privateConstructorUsedError;
  bool get fallback => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $AssistantStateCopyWith<AssistantState> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AssistantStateCopyWith<$Res> {
  factory $AssistantStateCopyWith(
          AssistantState value, $Res Function(AssistantState) then) =
      _$AssistantStateCopyWithImpl<$Res, AssistantState>;
  @useResult
  $Res call({SchoolForList? school, bool fallback});
}

/// @nodoc
class _$AssistantStateCopyWithImpl<$Res, $Val extends AssistantState>
    implements $AssistantStateCopyWith<$Res> {
  _$AssistantStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? school = freezed,
    Object? fallback = null,
  }) {
    return _then(_value.copyWith(
      school: freezed == school
          ? _value.school
          : school // ignore: cast_nullable_to_non_nullable
              as SchoolForList?,
      fallback: null == fallback
          ? _value.fallback
          : fallback // ignore: cast_nullable_to_non_nullable
              as bool,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$_AssistantStateCopyWith<$Res>
    implements $AssistantStateCopyWith<$Res> {
  factory _$$_AssistantStateCopyWith(
          _$_AssistantState value, $Res Function(_$_AssistantState) then) =
      __$$_AssistantStateCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({SchoolForList? school, bool fallback});
}

/// @nodoc
class __$$_AssistantStateCopyWithImpl<$Res>
    extends _$AssistantStateCopyWithImpl<$Res, _$_AssistantState>
    implements _$$_AssistantStateCopyWith<$Res> {
  __$$_AssistantStateCopyWithImpl(
      _$_AssistantState _value, $Res Function(_$_AssistantState) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? school = freezed,
    Object? fallback = null,
  }) {
    return _then(_$_AssistantState(
      school: freezed == school
          ? _value.school
          : school // ignore: cast_nullable_to_non_nullable
              as SchoolForList?,
      fallback: null == fallback
          ? _value.fallback
          : fallback // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc

class _$_AssistantState extends _AssistantState {
  _$_AssistantState({this.school = null, this.fallback = false}) : super._();

  @override
  @JsonKey()
  final SchoolForList? school;
  @override
  @JsonKey()
  final bool fallback;

  @override
  String toString() {
    return 'AssistantState(school: $school, fallback: $fallback)';
  }

  @override
  bool operator ==(dynamic other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$_AssistantState &&
            (identical(other.school, school) || other.school == school) &&
            (identical(other.fallback, fallback) ||
                other.fallback == fallback));
  }

  @override
  int get hashCode => Object.hash(runtimeType, school, fallback);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$_AssistantStateCopyWith<_$_AssistantState> get copyWith =>
      __$$_AssistantStateCopyWithImpl<_$_AssistantState>(this, _$identity);
}

abstract class _AssistantState extends AssistantState {
  factory _AssistantState({final SchoolForList? school, final bool fallback}) =
      _$_AssistantState;
  _AssistantState._() : super._();

  @override
  SchoolForList? get school;
  @override
  bool get fallback;
  @override
  @JsonKey(ignore: true)
  _$$_AssistantStateCopyWith<_$_AssistantState> get copyWith =>
      throw _privateConstructorUsedError;
}
