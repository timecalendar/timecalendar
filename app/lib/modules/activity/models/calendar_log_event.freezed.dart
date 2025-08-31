// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'calendar_log_event.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$CalendarLogEvent {

 String get uid; String get title; DateTime get startsAt; DateTime get endsAt; String? get location;
/// Create a copy of CalendarLogEvent
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CalendarLogEventCopyWith<CalendarLogEvent> get copyWith => _$CalendarLogEventCopyWithImpl<CalendarLogEvent>(this as CalendarLogEvent, _$identity);

  /// Serializes this CalendarLogEvent to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CalendarLogEvent&&(identical(other.uid, uid) || other.uid == uid)&&(identical(other.title, title) || other.title == title)&&(identical(other.startsAt, startsAt) || other.startsAt == startsAt)&&(identical(other.endsAt, endsAt) || other.endsAt == endsAt)&&(identical(other.location, location) || other.location == location));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,uid,title,startsAt,endsAt,location);

@override
String toString() {
  return 'CalendarLogEvent(uid: $uid, title: $title, startsAt: $startsAt, endsAt: $endsAt, location: $location)';
}


}

/// @nodoc
abstract mixin class $CalendarLogEventCopyWith<$Res>  {
  factory $CalendarLogEventCopyWith(CalendarLogEvent value, $Res Function(CalendarLogEvent) _then) = _$CalendarLogEventCopyWithImpl;
@useResult
$Res call({
 String uid, String title, DateTime startsAt, DateTime endsAt, String? location
});




}
/// @nodoc
class _$CalendarLogEventCopyWithImpl<$Res>
    implements $CalendarLogEventCopyWith<$Res> {
  _$CalendarLogEventCopyWithImpl(this._self, this._then);

  final CalendarLogEvent _self;
  final $Res Function(CalendarLogEvent) _then;

/// Create a copy of CalendarLogEvent
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? uid = null,Object? title = null,Object? startsAt = null,Object? endsAt = null,Object? location = freezed,}) {
  return _then(_self.copyWith(
uid: null == uid ? _self.uid : uid // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,startsAt: null == startsAt ? _self.startsAt : startsAt // ignore: cast_nullable_to_non_nullable
as DateTime,endsAt: null == endsAt ? _self.endsAt : endsAt // ignore: cast_nullable_to_non_nullable
as DateTime,location: freezed == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [CalendarLogEvent].
extension CalendarLogEventPatterns on CalendarLogEvent {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CalendarLogEvent value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CalendarLogEvent() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CalendarLogEvent value)  $default,){
final _that = this;
switch (_that) {
case _CalendarLogEvent():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CalendarLogEvent value)?  $default,){
final _that = this;
switch (_that) {
case _CalendarLogEvent() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String uid,  String title,  DateTime startsAt,  DateTime endsAt,  String? location)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CalendarLogEvent() when $default != null:
return $default(_that.uid,_that.title,_that.startsAt,_that.endsAt,_that.location);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String uid,  String title,  DateTime startsAt,  DateTime endsAt,  String? location)  $default,) {final _that = this;
switch (_that) {
case _CalendarLogEvent():
return $default(_that.uid,_that.title,_that.startsAt,_that.endsAt,_that.location);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String uid,  String title,  DateTime startsAt,  DateTime endsAt,  String? location)?  $default,) {final _that = this;
switch (_that) {
case _CalendarLogEvent() when $default != null:
return $default(_that.uid,_that.title,_that.startsAt,_that.endsAt,_that.location);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CalendarLogEvent implements CalendarLogEvent {
  const _CalendarLogEvent({required this.uid, required this.title, required this.startsAt, required this.endsAt, this.location});
  factory _CalendarLogEvent.fromJson(Map<String, dynamic> json) => _$CalendarLogEventFromJson(json);

@override final  String uid;
@override final  String title;
@override final  DateTime startsAt;
@override final  DateTime endsAt;
@override final  String? location;

/// Create a copy of CalendarLogEvent
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CalendarLogEventCopyWith<_CalendarLogEvent> get copyWith => __$CalendarLogEventCopyWithImpl<_CalendarLogEvent>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CalendarLogEventToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CalendarLogEvent&&(identical(other.uid, uid) || other.uid == uid)&&(identical(other.title, title) || other.title == title)&&(identical(other.startsAt, startsAt) || other.startsAt == startsAt)&&(identical(other.endsAt, endsAt) || other.endsAt == endsAt)&&(identical(other.location, location) || other.location == location));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,uid,title,startsAt,endsAt,location);

@override
String toString() {
  return 'CalendarLogEvent(uid: $uid, title: $title, startsAt: $startsAt, endsAt: $endsAt, location: $location)';
}


}

/// @nodoc
abstract mixin class _$CalendarLogEventCopyWith<$Res> implements $CalendarLogEventCopyWith<$Res> {
  factory _$CalendarLogEventCopyWith(_CalendarLogEvent value, $Res Function(_CalendarLogEvent) _then) = __$CalendarLogEventCopyWithImpl;
@override @useResult
$Res call({
 String uid, String title, DateTime startsAt, DateTime endsAt, String? location
});




}
/// @nodoc
class __$CalendarLogEventCopyWithImpl<$Res>
    implements _$CalendarLogEventCopyWith<$Res> {
  __$CalendarLogEventCopyWithImpl(this._self, this._then);

  final _CalendarLogEvent _self;
  final $Res Function(_CalendarLogEvent) _then;

/// Create a copy of CalendarLogEvent
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? uid = null,Object? title = null,Object? startsAt = null,Object? endsAt = null,Object? location = freezed,}) {
  return _then(_CalendarLogEvent(
uid: null == uid ? _self.uid : uid // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,startsAt: null == startsAt ? _self.startsAt : startsAt // ignore: cast_nullable_to_non_nullable
as DateTime,endsAt: null == endsAt ? _self.endsAt : endsAt // ignore: cast_nullable_to_non_nullable
as DateTime,location: freezed == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
