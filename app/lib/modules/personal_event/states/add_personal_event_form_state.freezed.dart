// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'add_personal_event_form_state.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$AddPersonalEventFormState {

 String get title; String get location; String get description; DateTime get date; TimeOfDay get timeStart; TimeOfDay get timeEnd; Color get color; bool get colorChanged;
/// Create a copy of AddPersonalEventFormState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AddPersonalEventFormStateCopyWith<AddPersonalEventFormState> get copyWith => _$AddPersonalEventFormStateCopyWithImpl<AddPersonalEventFormState>(this as AddPersonalEventFormState, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AddPersonalEventFormState&&(identical(other.title, title) || other.title == title)&&(identical(other.location, location) || other.location == location)&&(identical(other.description, description) || other.description == description)&&(identical(other.date, date) || other.date == date)&&(identical(other.timeStart, timeStart) || other.timeStart == timeStart)&&(identical(other.timeEnd, timeEnd) || other.timeEnd == timeEnd)&&(identical(other.color, color) || other.color == color)&&(identical(other.colorChanged, colorChanged) || other.colorChanged == colorChanged));
}


@override
int get hashCode => Object.hash(runtimeType,title,location,description,date,timeStart,timeEnd,color,colorChanged);

@override
String toString() {
  return 'AddPersonalEventFormState(title: $title, location: $location, description: $description, date: $date, timeStart: $timeStart, timeEnd: $timeEnd, color: $color, colorChanged: $colorChanged)';
}


}

/// @nodoc
abstract mixin class $AddPersonalEventFormStateCopyWith<$Res>  {
  factory $AddPersonalEventFormStateCopyWith(AddPersonalEventFormState value, $Res Function(AddPersonalEventFormState) _then) = _$AddPersonalEventFormStateCopyWithImpl;
@useResult
$Res call({
 String title, String location, String description, DateTime date, TimeOfDay timeStart, TimeOfDay timeEnd, Color color, bool colorChanged
});




}
/// @nodoc
class _$AddPersonalEventFormStateCopyWithImpl<$Res>
    implements $AddPersonalEventFormStateCopyWith<$Res> {
  _$AddPersonalEventFormStateCopyWithImpl(this._self, this._then);

  final AddPersonalEventFormState _self;
  final $Res Function(AddPersonalEventFormState) _then;

/// Create a copy of AddPersonalEventFormState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? title = null,Object? location = null,Object? description = null,Object? date = null,Object? timeStart = null,Object? timeEnd = null,Object? color = null,Object? colorChanged = null,}) {
  return _then(_self.copyWith(
title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,location: null == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as DateTime,timeStart: null == timeStart ? _self.timeStart : timeStart // ignore: cast_nullable_to_non_nullable
as TimeOfDay,timeEnd: null == timeEnd ? _self.timeEnd : timeEnd // ignore: cast_nullable_to_non_nullable
as TimeOfDay,color: null == color ? _self.color : color // ignore: cast_nullable_to_non_nullable
as Color,colorChanged: null == colorChanged ? _self.colorChanged : colorChanged // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [AddPersonalEventFormState].
extension AddPersonalEventFormStatePatterns on AddPersonalEventFormState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AddPersonalEventFormState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AddPersonalEventFormState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AddPersonalEventFormState value)  $default,){
final _that = this;
switch (_that) {
case _AddPersonalEventFormState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AddPersonalEventFormState value)?  $default,){
final _that = this;
switch (_that) {
case _AddPersonalEventFormState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String title,  String location,  String description,  DateTime date,  TimeOfDay timeStart,  TimeOfDay timeEnd,  Color color,  bool colorChanged)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AddPersonalEventFormState() when $default != null:
return $default(_that.title,_that.location,_that.description,_that.date,_that.timeStart,_that.timeEnd,_that.color,_that.colorChanged);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String title,  String location,  String description,  DateTime date,  TimeOfDay timeStart,  TimeOfDay timeEnd,  Color color,  bool colorChanged)  $default,) {final _that = this;
switch (_that) {
case _AddPersonalEventFormState():
return $default(_that.title,_that.location,_that.description,_that.date,_that.timeStart,_that.timeEnd,_that.color,_that.colorChanged);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String title,  String location,  String description,  DateTime date,  TimeOfDay timeStart,  TimeOfDay timeEnd,  Color color,  bool colorChanged)?  $default,) {final _that = this;
switch (_that) {
case _AddPersonalEventFormState() when $default != null:
return $default(_that.title,_that.location,_that.description,_that.date,_that.timeStart,_that.timeEnd,_that.color,_that.colorChanged);case _:
  return null;

}
}

}

/// @nodoc


class _AddPersonalEventFormState extends AddPersonalEventFormState {
   _AddPersonalEventFormState({required this.title, required this.location, required this.description, required this.date, required this.timeStart, required this.timeEnd, required this.color, this.colorChanged = false}): super._();
  

@override final  String title;
@override final  String location;
@override final  String description;
@override final  DateTime date;
@override final  TimeOfDay timeStart;
@override final  TimeOfDay timeEnd;
@override final  Color color;
@override@JsonKey() final  bool colorChanged;

/// Create a copy of AddPersonalEventFormState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AddPersonalEventFormStateCopyWith<_AddPersonalEventFormState> get copyWith => __$AddPersonalEventFormStateCopyWithImpl<_AddPersonalEventFormState>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AddPersonalEventFormState&&(identical(other.title, title) || other.title == title)&&(identical(other.location, location) || other.location == location)&&(identical(other.description, description) || other.description == description)&&(identical(other.date, date) || other.date == date)&&(identical(other.timeStart, timeStart) || other.timeStart == timeStart)&&(identical(other.timeEnd, timeEnd) || other.timeEnd == timeEnd)&&(identical(other.color, color) || other.color == color)&&(identical(other.colorChanged, colorChanged) || other.colorChanged == colorChanged));
}


@override
int get hashCode => Object.hash(runtimeType,title,location,description,date,timeStart,timeEnd,color,colorChanged);

@override
String toString() {
  return 'AddPersonalEventFormState(title: $title, location: $location, description: $description, date: $date, timeStart: $timeStart, timeEnd: $timeEnd, color: $color, colorChanged: $colorChanged)';
}


}

/// @nodoc
abstract mixin class _$AddPersonalEventFormStateCopyWith<$Res> implements $AddPersonalEventFormStateCopyWith<$Res> {
  factory _$AddPersonalEventFormStateCopyWith(_AddPersonalEventFormState value, $Res Function(_AddPersonalEventFormState) _then) = __$AddPersonalEventFormStateCopyWithImpl;
@override @useResult
$Res call({
 String title, String location, String description, DateTime date, TimeOfDay timeStart, TimeOfDay timeEnd, Color color, bool colorChanged
});




}
/// @nodoc
class __$AddPersonalEventFormStateCopyWithImpl<$Res>
    implements _$AddPersonalEventFormStateCopyWith<$Res> {
  __$AddPersonalEventFormStateCopyWithImpl(this._self, this._then);

  final _AddPersonalEventFormState _self;
  final $Res Function(_AddPersonalEventFormState) _then;

/// Create a copy of AddPersonalEventFormState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? title = null,Object? location = null,Object? description = null,Object? date = null,Object? timeStart = null,Object? timeEnd = null,Object? color = null,Object? colorChanged = null,}) {
  return _then(_AddPersonalEventFormState(
title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,location: null == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as DateTime,timeStart: null == timeStart ? _self.timeStart : timeStart // ignore: cast_nullable_to_non_nullable
as TimeOfDay,timeEnd: null == timeEnd ? _self.timeEnd : timeEnd // ignore: cast_nullable_to_non_nullable
as TimeOfDay,color: null == color ? _self.color : color // ignore: cast_nullable_to_non_nullable
as Color,colorChanged: null == colorChanged ? _self.colorChanged : colorChanged // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}

// dart format on
