// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'assistant_state.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$AssistantState {
  SchoolForList? get school;
  bool get fallback;

  /// Create a copy of AssistantState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $AssistantStateCopyWith<AssistantState> get copyWith =>
      _$AssistantStateCopyWithImpl<AssistantState>(
          this as AssistantState, _$identity);

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is AssistantState &&
            super == other &&
            (identical(other.school, school) || other.school == school) &&
            (identical(other.fallback, fallback) ||
                other.fallback == fallback));
  }

  @override
  int get hashCode =>
      Object.hash(runtimeType, super.hashCode, school, fallback);

  @override
  String toString() {
    return 'AssistantState(school: $school, fallback: $fallback)';
  }
}

/// @nodoc
abstract mixin class $AssistantStateCopyWith<$Res> {
  factory $AssistantStateCopyWith(
          AssistantState value, $Res Function(AssistantState) _then) =
      _$AssistantStateCopyWithImpl;
  @useResult
  $Res call({SchoolForList? school, bool fallback});
}

/// @nodoc
class _$AssistantStateCopyWithImpl<$Res>
    implements $AssistantStateCopyWith<$Res> {
  _$AssistantStateCopyWithImpl(this._self, this._then);

  final AssistantState _self;
  final $Res Function(AssistantState) _then;

  /// Create a copy of AssistantState
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? school = freezed,
    Object? fallback = null,
  }) {
    return _then(_self.copyWith(
      school: freezed == school
          ? _self.school
          : school // ignore: cast_nullable_to_non_nullable
              as SchoolForList?,
      fallback: null == fallback
          ? _self.fallback
          : fallback // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc

class _AssistantState extends AssistantState {
  _AssistantState({this.school = null, this.fallback = false}) : super._();

  @override
  @JsonKey()
  final SchoolForList? school;
  @override
  @JsonKey()
  final bool fallback;

  /// Create a copy of AssistantState
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$AssistantStateCopyWith<_AssistantState> get copyWith =>
      __$AssistantStateCopyWithImpl<_AssistantState>(this, _$identity);

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _AssistantState &&
            super == other &&
            (identical(other.school, school) || other.school == school) &&
            (identical(other.fallback, fallback) ||
                other.fallback == fallback));
  }

  @override
  int get hashCode =>
      Object.hash(runtimeType, super.hashCode, school, fallback);

  @override
  String toString() {
    return 'AssistantState(school: $school, fallback: $fallback)';
  }
}

/// @nodoc
abstract mixin class _$AssistantStateCopyWith<$Res>
    implements $AssistantStateCopyWith<$Res> {
  factory _$AssistantStateCopyWith(
          _AssistantState value, $Res Function(_AssistantState) _then) =
      __$AssistantStateCopyWithImpl;
  @override
  @useResult
  $Res call({SchoolForList? school, bool fallback});
}

/// @nodoc
class __$AssistantStateCopyWithImpl<$Res>
    implements _$AssistantStateCopyWith<$Res> {
  __$AssistantStateCopyWithImpl(this._self, this._then);

  final _AssistantState _self;
  final $Res Function(_AssistantState) _then;

  /// Create a copy of AssistantState
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? school = freezed,
    Object? fallback = null,
  }) {
    return _then(_AssistantState(
      school: freezed == school
          ? _self.school
          : school // ignore: cast_nullable_to_non_nullable
              as SchoolForList?,
      fallback: null == fallback
          ? _self.fallback
          : fallback // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

// dart format on
