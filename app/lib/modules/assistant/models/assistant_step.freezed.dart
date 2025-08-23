// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
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

 AssistantStepEnum get step; bool Function(AssistantState) get predicate; String get route;
/// Create a copy of AssistantStep
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AssistantStepCopyWith<AssistantStep> get copyWith => _$AssistantStepCopyWithImpl<AssistantStep>(this as AssistantStep, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AssistantStep&&(identical(other.step, step) || other.step == step)&&(identical(other.predicate, predicate) || other.predicate == predicate)&&(identical(other.route, route) || other.route == route));
}


@override
int get hashCode => Object.hash(runtimeType,step,predicate,route);

@override
String toString() {
  return 'AssistantStep(step: $step, predicate: $predicate, route: $route)';
}


}

/// @nodoc
abstract mixin class $AssistantStepCopyWith<$Res>  {
  factory $AssistantStepCopyWith(AssistantStep value, $Res Function(AssistantStep) _then) = _$AssistantStepCopyWithImpl;
@useResult
$Res call({
 AssistantStepEnum step, bool Function(AssistantState) predicate, String route
});




}
/// @nodoc
class _$AssistantStepCopyWithImpl<$Res>
    implements $AssistantStepCopyWith<$Res> {
  _$AssistantStepCopyWithImpl(this._self, this._then);

  final AssistantStep _self;
  final $Res Function(AssistantStep) _then;

/// Create a copy of AssistantStep
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? step = null,Object? predicate = null,Object? route = null,}) {
  return _then(_self.copyWith(
step: null == step ? _self.step : step // ignore: cast_nullable_to_non_nullable
as AssistantStepEnum,predicate: null == predicate ? _self.predicate : predicate // ignore: cast_nullable_to_non_nullable
as bool Function(AssistantState),route: null == route ? _self.route : route // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [AssistantStep].
extension AssistantStepPatterns on AssistantStep {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AssistantStep value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AssistantStep() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AssistantStep value)  $default,){
final _that = this;
switch (_that) {
case _AssistantStep():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AssistantStep value)?  $default,){
final _that = this;
switch (_that) {
case _AssistantStep() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( AssistantStepEnum step,  bool Function(AssistantState) predicate,  String route)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AssistantStep() when $default != null:
return $default(_that.step,_that.predicate,_that.route);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( AssistantStepEnum step,  bool Function(AssistantState) predicate,  String route)  $default,) {final _that = this;
switch (_that) {
case _AssistantStep():
return $default(_that.step,_that.predicate,_that.route);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( AssistantStepEnum step,  bool Function(AssistantState) predicate,  String route)?  $default,) {final _that = this;
switch (_that) {
case _AssistantStep() when $default != null:
return $default(_that.step,_that.predicate,_that.route);case _:
  return null;

}
}

}

/// @nodoc


class _AssistantStep implements AssistantStep {
   _AssistantStep({required this.step, required this.predicate, required this.route});
  

@override final  AssistantStepEnum step;
@override final  bool Function(AssistantState) predicate;
@override final  String route;

/// Create a copy of AssistantStep
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AssistantStepCopyWith<_AssistantStep> get copyWith => __$AssistantStepCopyWithImpl<_AssistantStep>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AssistantStep&&(identical(other.step, step) || other.step == step)&&(identical(other.predicate, predicate) || other.predicate == predicate)&&(identical(other.route, route) || other.route == route));
}


@override
int get hashCode => Object.hash(runtimeType,step,predicate,route);

@override
String toString() {
  return 'AssistantStep(step: $step, predicate: $predicate, route: $route)';
}


}

/// @nodoc
abstract mixin class _$AssistantStepCopyWith<$Res> implements $AssistantStepCopyWith<$Res> {
  factory _$AssistantStepCopyWith(_AssistantStep value, $Res Function(_AssistantStep) _then) = __$AssistantStepCopyWithImpl;
@override @useResult
$Res call({
 AssistantStepEnum step, bool Function(AssistantState) predicate, String route
});




}
/// @nodoc
class __$AssistantStepCopyWithImpl<$Res>
    implements _$AssistantStepCopyWith<$Res> {
  __$AssistantStepCopyWithImpl(this._self, this._then);

  final _AssistantStep _self;
  final $Res Function(_AssistantStep) _then;

/// Create a copy of AssistantStep
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? step = null,Object? predicate = null,Object? route = null,}) {
  return _then(_AssistantStep(
step: null == step ? _self.step : step // ignore: cast_nullable_to_non_nullable
as AssistantStepEnum,predicate: null == predicate ? _self.predicate : predicate // ignore: cast_nullable_to_non_nullable
as bool Function(AssistantState),route: null == route ? _self.route : route // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
