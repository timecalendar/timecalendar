// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'assistant_finished_result.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$AssistantFinishedResult {





@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AssistantFinishedResult);
}


@override
int get hashCode => runtimeType.hashCode;

@override
String toString() {
  return 'AssistantFinishedResult()';
}


}

/// @nodoc
class $AssistantFinishedResultCopyWith<$Res>  {
$AssistantFinishedResultCopyWith(AssistantFinishedResult _, $Res Function(AssistantFinishedResult) __);
}


/// Adds pattern-matching-related methods to [AssistantFinishedResult].
extension AssistantFinishedResultPatterns on AssistantFinishedResult {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>({TResult Function( AssistantFinishedResultFallback value)?  fallback,TResult Function( AssistantFinishedResultDone value)?  done,required TResult orElse(),}){
final _that = this;
switch (_that) {
case AssistantFinishedResultFallback() when fallback != null:
return fallback(_that);case AssistantFinishedResultDone() when done != null:
return done(_that);case _:
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

@optionalTypeArgs TResult map<TResult extends Object?>({required TResult Function( AssistantFinishedResultFallback value)  fallback,required TResult Function( AssistantFinishedResultDone value)  done,}){
final _that = this;
switch (_that) {
case AssistantFinishedResultFallback():
return fallback(_that);case AssistantFinishedResultDone():
return done(_that);}
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>({TResult? Function( AssistantFinishedResultFallback value)?  fallback,TResult? Function( AssistantFinishedResultDone value)?  done,}){
final _that = this;
switch (_that) {
case AssistantFinishedResultFallback() when fallback != null:
return fallback(_that);case AssistantFinishedResultDone() when done != null:
return done(_that);case _:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>({TResult Function()?  fallback,TResult Function()?  done,required TResult orElse(),}) {final _that = this;
switch (_that) {
case AssistantFinishedResultFallback() when fallback != null:
return fallback();case AssistantFinishedResultDone() when done != null:
return done();case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>({required TResult Function()  fallback,required TResult Function()  done,}) {final _that = this;
switch (_that) {
case AssistantFinishedResultFallback():
return fallback();case AssistantFinishedResultDone():
return done();}
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>({TResult? Function()?  fallback,TResult? Function()?  done,}) {final _that = this;
switch (_that) {
case AssistantFinishedResultFallback() when fallback != null:
return fallback();case AssistantFinishedResultDone() when done != null:
return done();case _:
  return null;

}
}

}

/// @nodoc


class AssistantFinishedResultFallback extends AssistantFinishedResult {
   AssistantFinishedResultFallback(): super._();
  






@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AssistantFinishedResultFallback);
}


@override
int get hashCode => runtimeType.hashCode;

@override
String toString() {
  return 'AssistantFinishedResult.fallback()';
}


}




/// @nodoc


class AssistantFinishedResultDone extends AssistantFinishedResult {
   AssistantFinishedResultDone(): super._();
  






@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AssistantFinishedResultDone);
}


@override
int get hashCode => runtimeType.hashCode;

@override
String toString() {
  return 'AssistantFinishedResult.done()';
}


}




// dart format on
