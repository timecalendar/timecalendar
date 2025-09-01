// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'calendar_log.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$CalendarLog {

 String get id; String get calendarId; String get calendarToken; String get calendarName; CalendarChange get calendarChange; DateTime get createdAt; DateTime get updatedAt;
/// Create a copy of CalendarLog
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CalendarLogCopyWith<CalendarLog> get copyWith => _$CalendarLogCopyWithImpl<CalendarLog>(this as CalendarLog, _$identity);

  /// Serializes this CalendarLog to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CalendarLog&&(identical(other.id, id) || other.id == id)&&(identical(other.calendarId, calendarId) || other.calendarId == calendarId)&&(identical(other.calendarToken, calendarToken) || other.calendarToken == calendarToken)&&(identical(other.calendarName, calendarName) || other.calendarName == calendarName)&&(identical(other.calendarChange, calendarChange) || other.calendarChange == calendarChange)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,calendarId,calendarToken,calendarName,calendarChange,createdAt,updatedAt);

@override
String toString() {
  return 'CalendarLog(id: $id, calendarId: $calendarId, calendarToken: $calendarToken, calendarName: $calendarName, calendarChange: $calendarChange, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class $CalendarLogCopyWith<$Res>  {
  factory $CalendarLogCopyWith(CalendarLog value, $Res Function(CalendarLog) _then) = _$CalendarLogCopyWithImpl;
@useResult
$Res call({
 String id, String calendarId, String calendarToken, String calendarName, CalendarChange calendarChange, DateTime createdAt, DateTime updatedAt
});


$CalendarChangeCopyWith<$Res> get calendarChange;

}
/// @nodoc
class _$CalendarLogCopyWithImpl<$Res>
    implements $CalendarLogCopyWith<$Res> {
  _$CalendarLogCopyWithImpl(this._self, this._then);

  final CalendarLog _self;
  final $Res Function(CalendarLog) _then;

/// Create a copy of CalendarLog
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? calendarId = null,Object? calendarToken = null,Object? calendarName = null,Object? calendarChange = null,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,calendarId: null == calendarId ? _self.calendarId : calendarId // ignore: cast_nullable_to_non_nullable
as String,calendarToken: null == calendarToken ? _self.calendarToken : calendarToken // ignore: cast_nullable_to_non_nullable
as String,calendarName: null == calendarName ? _self.calendarName : calendarName // ignore: cast_nullable_to_non_nullable
as String,calendarChange: null == calendarChange ? _self.calendarChange : calendarChange // ignore: cast_nullable_to_non_nullable
as CalendarChange,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}
/// Create a copy of CalendarLog
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CalendarChangeCopyWith<$Res> get calendarChange {
  
  return $CalendarChangeCopyWith<$Res>(_self.calendarChange, (value) {
    return _then(_self.copyWith(calendarChange: value));
  });
}
}


/// Adds pattern-matching-related methods to [CalendarLog].
extension CalendarLogPatterns on CalendarLog {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CalendarLog value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CalendarLog() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CalendarLog value)  $default,){
final _that = this;
switch (_that) {
case _CalendarLog():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CalendarLog value)?  $default,){
final _that = this;
switch (_that) {
case _CalendarLog() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String calendarId,  String calendarToken,  String calendarName,  CalendarChange calendarChange,  DateTime createdAt,  DateTime updatedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CalendarLog() when $default != null:
return $default(_that.id,_that.calendarId,_that.calendarToken,_that.calendarName,_that.calendarChange,_that.createdAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String calendarId,  String calendarToken,  String calendarName,  CalendarChange calendarChange,  DateTime createdAt,  DateTime updatedAt)  $default,) {final _that = this;
switch (_that) {
case _CalendarLog():
return $default(_that.id,_that.calendarId,_that.calendarToken,_that.calendarName,_that.calendarChange,_that.createdAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String calendarId,  String calendarToken,  String calendarName,  CalendarChange calendarChange,  DateTime createdAt,  DateTime updatedAt)?  $default,) {final _that = this;
switch (_that) {
case _CalendarLog() when $default != null:
return $default(_that.id,_that.calendarId,_that.calendarToken,_that.calendarName,_that.calendarChange,_that.createdAt,_that.updatedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CalendarLog implements CalendarLog {
  const _CalendarLog({required this.id, required this.calendarId, required this.calendarToken, required this.calendarName, required this.calendarChange, required this.createdAt, required this.updatedAt});
  factory _CalendarLog.fromJson(Map<String, dynamic> json) => _$CalendarLogFromJson(json);

@override final  String id;
@override final  String calendarId;
@override final  String calendarToken;
@override final  String calendarName;
@override final  CalendarChange calendarChange;
@override final  DateTime createdAt;
@override final  DateTime updatedAt;

/// Create a copy of CalendarLog
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CalendarLogCopyWith<_CalendarLog> get copyWith => __$CalendarLogCopyWithImpl<_CalendarLog>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CalendarLogToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CalendarLog&&(identical(other.id, id) || other.id == id)&&(identical(other.calendarId, calendarId) || other.calendarId == calendarId)&&(identical(other.calendarToken, calendarToken) || other.calendarToken == calendarToken)&&(identical(other.calendarName, calendarName) || other.calendarName == calendarName)&&(identical(other.calendarChange, calendarChange) || other.calendarChange == calendarChange)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,calendarId,calendarToken,calendarName,calendarChange,createdAt,updatedAt);

@override
String toString() {
  return 'CalendarLog(id: $id, calendarId: $calendarId, calendarToken: $calendarToken, calendarName: $calendarName, calendarChange: $calendarChange, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class _$CalendarLogCopyWith<$Res> implements $CalendarLogCopyWith<$Res> {
  factory _$CalendarLogCopyWith(_CalendarLog value, $Res Function(_CalendarLog) _then) = __$CalendarLogCopyWithImpl;
@override @useResult
$Res call({
 String id, String calendarId, String calendarToken, String calendarName, CalendarChange calendarChange, DateTime createdAt, DateTime updatedAt
});


@override $CalendarChangeCopyWith<$Res> get calendarChange;

}
/// @nodoc
class __$CalendarLogCopyWithImpl<$Res>
    implements _$CalendarLogCopyWith<$Res> {
  __$CalendarLogCopyWithImpl(this._self, this._then);

  final _CalendarLog _self;
  final $Res Function(_CalendarLog) _then;

/// Create a copy of CalendarLog
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? calendarId = null,Object? calendarToken = null,Object? calendarName = null,Object? calendarChange = null,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(_CalendarLog(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,calendarId: null == calendarId ? _self.calendarId : calendarId // ignore: cast_nullable_to_non_nullable
as String,calendarToken: null == calendarToken ? _self.calendarToken : calendarToken // ignore: cast_nullable_to_non_nullable
as String,calendarName: null == calendarName ? _self.calendarName : calendarName // ignore: cast_nullable_to_non_nullable
as String,calendarChange: null == calendarChange ? _self.calendarChange : calendarChange // ignore: cast_nullable_to_non_nullable
as CalendarChange,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

/// Create a copy of CalendarLog
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CalendarChangeCopyWith<$Res> get calendarChange {
  
  return $CalendarChangeCopyWith<$Res>(_self.calendarChange, (value) {
    return _then(_self.copyWith(calendarChange: value));
  });
}
}

// dart format on
