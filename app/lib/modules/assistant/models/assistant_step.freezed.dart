// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target

part of 'assistant_step.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#custom-getters-and-methods');

/// @nodoc
mixin _$AssistantStep {
  AssistantStepEnum get step => throw _privateConstructorUsedError;
  bool Function(AssistantState) get predicate =>
      throw _privateConstructorUsedError;
  String get route => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $AssistantStepCopyWith<AssistantStep> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AssistantStepCopyWith<$Res> {
  factory $AssistantStepCopyWith(
          AssistantStep value, $Res Function(AssistantStep) then) =
      _$AssistantStepCopyWithImpl<$Res>;
  $Res call(
      {AssistantStepEnum step,
      bool Function(AssistantState) predicate,
      String route});
}

/// @nodoc
class _$AssistantStepCopyWithImpl<$Res>
    implements $AssistantStepCopyWith<$Res> {
  _$AssistantStepCopyWithImpl(this._value, this._then);

  final AssistantStep _value;
  // ignore: unused_field
  final $Res Function(AssistantStep) _then;

  @override
  $Res call({
    Object? step = freezed,
    Object? predicate = freezed,
    Object? route = freezed,
  }) {
    return _then(_value.copyWith(
      step: step == freezed
          ? _value.step
          : step // ignore: cast_nullable_to_non_nullable
              as AssistantStepEnum,
      predicate: predicate == freezed
          ? _value.predicate
          : predicate // ignore: cast_nullable_to_non_nullable
              as bool Function(AssistantState),
      route: route == freezed
          ? _value.route
          : route // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
abstract class _$$_AssistantStepCopyWith<$Res>
    implements $AssistantStepCopyWith<$Res> {
  factory _$$_AssistantStepCopyWith(
          _$_AssistantStep value, $Res Function(_$_AssistantStep) then) =
      __$$_AssistantStepCopyWithImpl<$Res>;
  @override
  $Res call(
      {AssistantStepEnum step,
      bool Function(AssistantState) predicate,
      String route});
}

/// @nodoc
class __$$_AssistantStepCopyWithImpl<$Res>
    extends _$AssistantStepCopyWithImpl<$Res>
    implements _$$_AssistantStepCopyWith<$Res> {
  __$$_AssistantStepCopyWithImpl(
      _$_AssistantStep _value, $Res Function(_$_AssistantStep) _then)
      : super(_value, (v) => _then(v as _$_AssistantStep));

  @override
  _$_AssistantStep get _value => super._value as _$_AssistantStep;

  @override
  $Res call({
    Object? step = freezed,
    Object? predicate = freezed,
    Object? route = freezed,
  }) {
    return _then(_$_AssistantStep(
      step: step == freezed
          ? _value.step
          : step // ignore: cast_nullable_to_non_nullable
              as AssistantStepEnum,
      predicate: predicate == freezed
          ? _value.predicate
          : predicate // ignore: cast_nullable_to_non_nullable
              as bool Function(AssistantState),
      route: route == freezed
          ? _value.route
          : route // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$_AssistantStep implements _AssistantStep {
  _$_AssistantStep(
      {required this.step, required this.predicate, required this.route});

  @override
  final AssistantStepEnum step;
  @override
  final bool Function(AssistantState) predicate;
  @override
  final String route;

  @override
  String toString() {
    return 'AssistantStep(step: $step, predicate: $predicate, route: $route)';
  }

  @override
  bool operator ==(dynamic other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$_AssistantStep &&
            const DeepCollectionEquality().equals(other.step, step) &&
            (identical(other.predicate, predicate) ||
                other.predicate == predicate) &&
            const DeepCollectionEquality().equals(other.route, route));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      const DeepCollectionEquality().hash(step),
      predicate,
      const DeepCollectionEquality().hash(route));

  @JsonKey(ignore: true)
  @override
  _$$_AssistantStepCopyWith<_$_AssistantStep> get copyWith =>
      __$$_AssistantStepCopyWithImpl<_$_AssistantStep>(this, _$identity);
}

abstract class _AssistantStep implements AssistantStep {
  factory _AssistantStep(
      {required final AssistantStepEnum step,
      required final bool Function(AssistantState) predicate,
      required final String route}) = _$_AssistantStep;

  @override
  AssistantStepEnum get step;
  @override
  bool Function(AssistantState) get predicate;
  @override
  String get route;
  @override
  @JsonKey(ignore: true)
  _$$_AssistantStepCopyWith<_$_AssistantStep> get copyWith =>
      throw _privateConstructorUsedError;
}
