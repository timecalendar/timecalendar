// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'assistant_step.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$AssistantStep {
  AssistantStepEnum get step;
  bool Function(AssistantState) get predicate;
  String get route;

  /// Create a copy of AssistantStep
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $AssistantStepCopyWith<AssistantStep> get copyWith =>
      _$AssistantStepCopyWithImpl<AssistantStep>(
          this as AssistantStep, _$identity);

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is AssistantStep &&
            super == other &&
            (identical(other.step, step) || other.step == step) &&
            (identical(other.predicate, predicate) ||
                other.predicate == predicate) &&
            (identical(other.route, route) || other.route == route));
  }

  @override
  int get hashCode =>
      Object.hash(runtimeType, super.hashCode, step, predicate, route);

  @override
  String toString() {
    return 'AssistantStep(step: $step, predicate: $predicate, route: $route)';
  }
}

/// @nodoc
abstract mixin class $AssistantStepCopyWith<$Res> {
  factory $AssistantStepCopyWith(
          AssistantStep value, $Res Function(AssistantStep) _then) =
      _$AssistantStepCopyWithImpl;
  @useResult
  $Res call(
      {AssistantStepEnum step,
      bool Function(AssistantState) predicate,
      String route});
}

/// @nodoc
class _$AssistantStepCopyWithImpl<$Res>
    implements $AssistantStepCopyWith<$Res> {
  _$AssistantStepCopyWithImpl(this._self, this._then);

  final AssistantStep _self;
  final $Res Function(AssistantStep) _then;

  /// Create a copy of AssistantStep
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? step = null,
    Object? predicate = null,
    Object? route = null,
  }) {
    return _then(_self.copyWith(
      step: null == step
          ? _self.step
          : step // ignore: cast_nullable_to_non_nullable
              as AssistantStepEnum,
      predicate: null == predicate
          ? _self.predicate
          : predicate // ignore: cast_nullable_to_non_nullable
              as bool Function(AssistantState),
      route: null == route
          ? _self.route
          : route // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _AssistantStep implements AssistantStep {
  _AssistantStep(
      {required this.step, required this.predicate, required this.route});

  @override
  final AssistantStepEnum step;
  @override
  final bool Function(AssistantState) predicate;
  @override
  final String route;

  /// Create a copy of AssistantStep
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$AssistantStepCopyWith<_AssistantStep> get copyWith =>
      __$AssistantStepCopyWithImpl<_AssistantStep>(this, _$identity);

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _AssistantStep &&
            super == other &&
            (identical(other.step, step) || other.step == step) &&
            (identical(other.predicate, predicate) ||
                other.predicate == predicate) &&
            (identical(other.route, route) || other.route == route));
  }

  @override
  int get hashCode =>
      Object.hash(runtimeType, super.hashCode, step, predicate, route);

  @override
  String toString() {
    return 'AssistantStep(step: $step, predicate: $predicate, route: $route)';
  }
}

/// @nodoc
abstract mixin class _$AssistantStepCopyWith<$Res>
    implements $AssistantStepCopyWith<$Res> {
  factory _$AssistantStepCopyWith(
          _AssistantStep value, $Res Function(_AssistantStep) _then) =
      __$AssistantStepCopyWithImpl;
  @override
  @useResult
  $Res call(
      {AssistantStepEnum step,
      bool Function(AssistantState) predicate,
      String route});
}

/// @nodoc
class __$AssistantStepCopyWithImpl<$Res>
    implements _$AssistantStepCopyWith<$Res> {
  __$AssistantStepCopyWithImpl(this._self, this._then);

  final _AssistantStep _self;
  final $Res Function(_AssistantStep) _then;

  /// Create a copy of AssistantStep
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? step = null,
    Object? predicate = null,
    Object? route = null,
  }) {
    return _then(_AssistantStep(
      step: null == step
          ? _self.step
          : step // ignore: cast_nullable_to_non_nullable
              as AssistantStepEnum,
      predicate: null == predicate
          ? _self.predicate
          : predicate // ignore: cast_nullable_to_non_nullable
              as bool Function(AssistantState),
      route: null == route
          ? _self.route
          : route // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

// dart format on
