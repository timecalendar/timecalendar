// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'calendar_change.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$CalendarChange {

 List<CalendarLogEvent> get oldItems; List<CalendarLogEvent> get newItems; List<CalendarEventChange> get changedItems;
/// Create a copy of CalendarChange
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CalendarChangeCopyWith<CalendarChange> get copyWith => _$CalendarChangeCopyWithImpl<CalendarChange>(this as CalendarChange, _$identity);

  /// Serializes this CalendarChange to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CalendarChange&&const DeepCollectionEquality().equals(other.oldItems, oldItems)&&const DeepCollectionEquality().equals(other.newItems, newItems)&&const DeepCollectionEquality().equals(other.changedItems, changedItems));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(oldItems),const DeepCollectionEquality().hash(newItems),const DeepCollectionEquality().hash(changedItems));

@override
String toString() {
  return 'CalendarChange(oldItems: $oldItems, newItems: $newItems, changedItems: $changedItems)';
}


}

/// @nodoc
abstract mixin class $CalendarChangeCopyWith<$Res>  {
  factory $CalendarChangeCopyWith(CalendarChange value, $Res Function(CalendarChange) _then) = _$CalendarChangeCopyWithImpl;
@useResult
$Res call({
 List<CalendarLogEvent> oldItems, List<CalendarLogEvent> newItems, List<CalendarEventChange> changedItems
});




}
/// @nodoc
class _$CalendarChangeCopyWithImpl<$Res>
    implements $CalendarChangeCopyWith<$Res> {
  _$CalendarChangeCopyWithImpl(this._self, this._then);

  final CalendarChange _self;
  final $Res Function(CalendarChange) _then;

/// Create a copy of CalendarChange
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? oldItems = null,Object? newItems = null,Object? changedItems = null,}) {
  return _then(_self.copyWith(
oldItems: null == oldItems ? _self.oldItems : oldItems // ignore: cast_nullable_to_non_nullable
as List<CalendarLogEvent>,newItems: null == newItems ? _self.newItems : newItems // ignore: cast_nullable_to_non_nullable
as List<CalendarLogEvent>,changedItems: null == changedItems ? _self.changedItems : changedItems // ignore: cast_nullable_to_non_nullable
as List<CalendarEventChange>,
  ));
}

}


/// Adds pattern-matching-related methods to [CalendarChange].
extension CalendarChangePatterns on CalendarChange {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CalendarChange value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CalendarChange() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CalendarChange value)  $default,){
final _that = this;
switch (_that) {
case _CalendarChange():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CalendarChange value)?  $default,){
final _that = this;
switch (_that) {
case _CalendarChange() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<CalendarLogEvent> oldItems,  List<CalendarLogEvent> newItems,  List<CalendarEventChange> changedItems)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CalendarChange() when $default != null:
return $default(_that.oldItems,_that.newItems,_that.changedItems);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<CalendarLogEvent> oldItems,  List<CalendarLogEvent> newItems,  List<CalendarEventChange> changedItems)  $default,) {final _that = this;
switch (_that) {
case _CalendarChange():
return $default(_that.oldItems,_that.newItems,_that.changedItems);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<CalendarLogEvent> oldItems,  List<CalendarLogEvent> newItems,  List<CalendarEventChange> changedItems)?  $default,) {final _that = this;
switch (_that) {
case _CalendarChange() when $default != null:
return $default(_that.oldItems,_that.newItems,_that.changedItems);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CalendarChange implements CalendarChange {
  const _CalendarChange({required final  List<CalendarLogEvent> oldItems, required final  List<CalendarLogEvent> newItems, required final  List<CalendarEventChange> changedItems}): _oldItems = oldItems,_newItems = newItems,_changedItems = changedItems;
  factory _CalendarChange.fromJson(Map<String, dynamic> json) => _$CalendarChangeFromJson(json);

 final  List<CalendarLogEvent> _oldItems;
@override List<CalendarLogEvent> get oldItems {
  if (_oldItems is EqualUnmodifiableListView) return _oldItems;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_oldItems);
}

 final  List<CalendarLogEvent> _newItems;
@override List<CalendarLogEvent> get newItems {
  if (_newItems is EqualUnmodifiableListView) return _newItems;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_newItems);
}

 final  List<CalendarEventChange> _changedItems;
@override List<CalendarEventChange> get changedItems {
  if (_changedItems is EqualUnmodifiableListView) return _changedItems;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_changedItems);
}


/// Create a copy of CalendarChange
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CalendarChangeCopyWith<_CalendarChange> get copyWith => __$CalendarChangeCopyWithImpl<_CalendarChange>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CalendarChangeToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CalendarChange&&const DeepCollectionEquality().equals(other._oldItems, _oldItems)&&const DeepCollectionEquality().equals(other._newItems, _newItems)&&const DeepCollectionEquality().equals(other._changedItems, _changedItems));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_oldItems),const DeepCollectionEquality().hash(_newItems),const DeepCollectionEquality().hash(_changedItems));

@override
String toString() {
  return 'CalendarChange(oldItems: $oldItems, newItems: $newItems, changedItems: $changedItems)';
}


}

/// @nodoc
abstract mixin class _$CalendarChangeCopyWith<$Res> implements $CalendarChangeCopyWith<$Res> {
  factory _$CalendarChangeCopyWith(_CalendarChange value, $Res Function(_CalendarChange) _then) = __$CalendarChangeCopyWithImpl;
@override @useResult
$Res call({
 List<CalendarLogEvent> oldItems, List<CalendarLogEvent> newItems, List<CalendarEventChange> changedItems
});




}
/// @nodoc
class __$CalendarChangeCopyWithImpl<$Res>
    implements _$CalendarChangeCopyWith<$Res> {
  __$CalendarChangeCopyWithImpl(this._self, this._then);

  final _CalendarChange _self;
  final $Res Function(_CalendarChange) _then;

/// Create a copy of CalendarChange
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? oldItems = null,Object? newItems = null,Object? changedItems = null,}) {
  return _then(_CalendarChange(
oldItems: null == oldItems ? _self._oldItems : oldItems // ignore: cast_nullable_to_non_nullable
as List<CalendarLogEvent>,newItems: null == newItems ? _self._newItems : newItems // ignore: cast_nullable_to_non_nullable
as List<CalendarLogEvent>,changedItems: null == changedItems ? _self._changedItems : changedItems // ignore: cast_nullable_to_non_nullable
as List<CalendarEventChange>,
  ));
}


}


/// @nodoc
mixin _$CalendarEventChange {

 CalendarLogEvent get oldEvent; CalendarLogEvent get newEvent;
/// Create a copy of CalendarEventChange
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CalendarEventChangeCopyWith<CalendarEventChange> get copyWith => _$CalendarEventChangeCopyWithImpl<CalendarEventChange>(this as CalendarEventChange, _$identity);

  /// Serializes this CalendarEventChange to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CalendarEventChange&&(identical(other.oldEvent, oldEvent) || other.oldEvent == oldEvent)&&(identical(other.newEvent, newEvent) || other.newEvent == newEvent));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,oldEvent,newEvent);

@override
String toString() {
  return 'CalendarEventChange(oldEvent: $oldEvent, newEvent: $newEvent)';
}


}

/// @nodoc
abstract mixin class $CalendarEventChangeCopyWith<$Res>  {
  factory $CalendarEventChangeCopyWith(CalendarEventChange value, $Res Function(CalendarEventChange) _then) = _$CalendarEventChangeCopyWithImpl;
@useResult
$Res call({
 CalendarLogEvent oldEvent, CalendarLogEvent newEvent
});


$CalendarLogEventCopyWith<$Res> get oldEvent;$CalendarLogEventCopyWith<$Res> get newEvent;

}
/// @nodoc
class _$CalendarEventChangeCopyWithImpl<$Res>
    implements $CalendarEventChangeCopyWith<$Res> {
  _$CalendarEventChangeCopyWithImpl(this._self, this._then);

  final CalendarEventChange _self;
  final $Res Function(CalendarEventChange) _then;

/// Create a copy of CalendarEventChange
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? oldEvent = null,Object? newEvent = null,}) {
  return _then(_self.copyWith(
oldEvent: null == oldEvent ? _self.oldEvent : oldEvent // ignore: cast_nullable_to_non_nullable
as CalendarLogEvent,newEvent: null == newEvent ? _self.newEvent : newEvent // ignore: cast_nullable_to_non_nullable
as CalendarLogEvent,
  ));
}
/// Create a copy of CalendarEventChange
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CalendarLogEventCopyWith<$Res> get oldEvent {
  
  return $CalendarLogEventCopyWith<$Res>(_self.oldEvent, (value) {
    return _then(_self.copyWith(oldEvent: value));
  });
}/// Create a copy of CalendarEventChange
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CalendarLogEventCopyWith<$Res> get newEvent {
  
  return $CalendarLogEventCopyWith<$Res>(_self.newEvent, (value) {
    return _then(_self.copyWith(newEvent: value));
  });
}
}


/// Adds pattern-matching-related methods to [CalendarEventChange].
extension CalendarEventChangePatterns on CalendarEventChange {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CalendarEventChange value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CalendarEventChange() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CalendarEventChange value)  $default,){
final _that = this;
switch (_that) {
case _CalendarEventChange():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CalendarEventChange value)?  $default,){
final _that = this;
switch (_that) {
case _CalendarEventChange() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( CalendarLogEvent oldEvent,  CalendarLogEvent newEvent)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CalendarEventChange() when $default != null:
return $default(_that.oldEvent,_that.newEvent);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( CalendarLogEvent oldEvent,  CalendarLogEvent newEvent)  $default,) {final _that = this;
switch (_that) {
case _CalendarEventChange():
return $default(_that.oldEvent,_that.newEvent);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( CalendarLogEvent oldEvent,  CalendarLogEvent newEvent)?  $default,) {final _that = this;
switch (_that) {
case _CalendarEventChange() when $default != null:
return $default(_that.oldEvent,_that.newEvent);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CalendarEventChange implements CalendarEventChange {
  const _CalendarEventChange({required this.oldEvent, required this.newEvent});
  factory _CalendarEventChange.fromJson(Map<String, dynamic> json) => _$CalendarEventChangeFromJson(json);

@override final  CalendarLogEvent oldEvent;
@override final  CalendarLogEvent newEvent;

/// Create a copy of CalendarEventChange
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CalendarEventChangeCopyWith<_CalendarEventChange> get copyWith => __$CalendarEventChangeCopyWithImpl<_CalendarEventChange>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CalendarEventChangeToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CalendarEventChange&&(identical(other.oldEvent, oldEvent) || other.oldEvent == oldEvent)&&(identical(other.newEvent, newEvent) || other.newEvent == newEvent));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,oldEvent,newEvent);

@override
String toString() {
  return 'CalendarEventChange(oldEvent: $oldEvent, newEvent: $newEvent)';
}


}

/// @nodoc
abstract mixin class _$CalendarEventChangeCopyWith<$Res> implements $CalendarEventChangeCopyWith<$Res> {
  factory _$CalendarEventChangeCopyWith(_CalendarEventChange value, $Res Function(_CalendarEventChange) _then) = __$CalendarEventChangeCopyWithImpl;
@override @useResult
$Res call({
 CalendarLogEvent oldEvent, CalendarLogEvent newEvent
});


@override $CalendarLogEventCopyWith<$Res> get oldEvent;@override $CalendarLogEventCopyWith<$Res> get newEvent;

}
/// @nodoc
class __$CalendarEventChangeCopyWithImpl<$Res>
    implements _$CalendarEventChangeCopyWith<$Res> {
  __$CalendarEventChangeCopyWithImpl(this._self, this._then);

  final _CalendarEventChange _self;
  final $Res Function(_CalendarEventChange) _then;

/// Create a copy of CalendarEventChange
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? oldEvent = null,Object? newEvent = null,}) {
  return _then(_CalendarEventChange(
oldEvent: null == oldEvent ? _self.oldEvent : oldEvent // ignore: cast_nullable_to_non_nullable
as CalendarLogEvent,newEvent: null == newEvent ? _self.newEvent : newEvent // ignore: cast_nullable_to_non_nullable
as CalendarLogEvent,
  ));
}

/// Create a copy of CalendarEventChange
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CalendarLogEventCopyWith<$Res> get oldEvent {
  
  return $CalendarLogEventCopyWith<$Res>(_self.oldEvent, (value) {
    return _then(_self.copyWith(oldEvent: value));
  });
}/// Create a copy of CalendarEventChange
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CalendarLogEventCopyWith<$Res> get newEvent {
  
  return $CalendarLogEventCopyWith<$Res>(_self.newEvent, (value) {
    return _then(_self.copyWith(newEvent: value));
  });
}
}

// dart format on
