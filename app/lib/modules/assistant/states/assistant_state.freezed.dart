// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
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

 SchoolForList? get school; bool get fallback;
/// Create a copy of AssistantState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AssistantStateCopyWith<AssistantState> get copyWith => _$AssistantStateCopyWithImpl<AssistantState>(this as AssistantState, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AssistantState&&(identical(other.school, school) || other.school == school)&&(identical(other.fallback, fallback) || other.fallback == fallback));
}


@override
int get hashCode => Object.hash(runtimeType,school,fallback);

@override
String toString() {
  return 'AssistantState(school: $school, fallback: $fallback)';
}


}

/// @nodoc
abstract mixin class $AssistantStateCopyWith<$Res>  {
  factory $AssistantStateCopyWith(AssistantState value, $Res Function(AssistantState) _then) = _$AssistantStateCopyWithImpl;
@useResult
$Res call({
 SchoolForList? school, bool fallback
});




}
/// @nodoc
class _$AssistantStateCopyWithImpl<$Res>
    implements $AssistantStateCopyWith<$Res> {
  _$AssistantStateCopyWithImpl(this._self, this._then);

  final AssistantState _self;
  final $Res Function(AssistantState) _then;

/// Create a copy of AssistantState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? school = freezed,Object? fallback = null,}) {
  return _then(_self.copyWith(
school: freezed == school ? _self.school : school // ignore: cast_nullable_to_non_nullable
as SchoolForList?,fallback: null == fallback ? _self.fallback : fallback // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [AssistantState].
extension AssistantStatePatterns on AssistantState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AssistantState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AssistantState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AssistantState value)  $default,){
final _that = this;
switch (_that) {
case _AssistantState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AssistantState value)?  $default,){
final _that = this;
switch (_that) {
case _AssistantState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( SchoolForList? school,  bool fallback)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AssistantState() when $default != null:
return $default(_that.school,_that.fallback);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( SchoolForList? school,  bool fallback)  $default,) {final _that = this;
switch (_that) {
case _AssistantState():
return $default(_that.school,_that.fallback);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( SchoolForList? school,  bool fallback)?  $default,) {final _that = this;
switch (_that) {
case _AssistantState() when $default != null:
return $default(_that.school,_that.fallback);case _:
  return null;

}
}

}

/// @nodoc


class _AssistantState extends AssistantState {
   _AssistantState({this.school = null, this.fallback = false}): super._();
  

@override@JsonKey() final  SchoolForList? school;
@override@JsonKey() final  bool fallback;

/// Create a copy of AssistantState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AssistantStateCopyWith<_AssistantState> get copyWith => __$AssistantStateCopyWithImpl<_AssistantState>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AssistantState&&(identical(other.school, school) || other.school == school)&&(identical(other.fallback, fallback) || other.fallback == fallback));
}


@override
int get hashCode => Object.hash(runtimeType,school,fallback);

@override
String toString() {
  return 'AssistantState(school: $school, fallback: $fallback)';
}


}

/// @nodoc
abstract mixin class _$AssistantStateCopyWith<$Res> implements $AssistantStateCopyWith<$Res> {
  factory _$AssistantStateCopyWith(_AssistantState value, $Res Function(_AssistantState) _then) = __$AssistantStateCopyWithImpl;
@override @useResult
$Res call({
 SchoolForList? school, bool fallback
});




}
/// @nodoc
class __$AssistantStateCopyWithImpl<$Res>
    implements _$AssistantStateCopyWith<$Res> {
  __$AssistantStateCopyWithImpl(this._self, this._then);

  final _AssistantState _self;
  final $Res Function(_AssistantState) _then;

/// Create a copy of AssistantState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? school = freezed,Object? fallback = null,}) {
  return _then(_AssistantState(
school: freezed == school ? _self.school : school // ignore: cast_nullable_to_non_nullable
as SchoolForList?,fallback: null == fallback ? _self.fallback : fallback // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}

// dart format on
