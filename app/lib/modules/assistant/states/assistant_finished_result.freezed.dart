// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target

part of 'assistant_finished_result.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more informations: https://github.com/rrousselGit/freezed#custom-getters-and-methods');

/// @nodoc
class _$AssistantFinishedResultTearOff {
  const _$AssistantFinishedResultTearOff();

  _AssistantFinishedResultFallback fallback() {
    return _AssistantFinishedResultFallback();
  }

  _AssistantFinishedResultDone done({required String token}) {
    return _AssistantFinishedResultDone(
      token: token,
    );
  }
}

/// @nodoc
const $AssistantFinishedResult = _$AssistantFinishedResultTearOff();

/// @nodoc
mixin _$AssistantFinishedResult {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() fallback,
    required TResult Function(String token) done,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult Function()? fallback,
    TResult Function(String token)? done,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? fallback,
    TResult Function(String token)? done,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_AssistantFinishedResultFallback value) fallback,
    required TResult Function(_AssistantFinishedResultDone value) done,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult Function(_AssistantFinishedResultFallback value)? fallback,
    TResult Function(_AssistantFinishedResultDone value)? done,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_AssistantFinishedResultFallback value)? fallback,
    TResult Function(_AssistantFinishedResultDone value)? done,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AssistantFinishedResultCopyWith<$Res> {
  factory $AssistantFinishedResultCopyWith(AssistantFinishedResult value,
          $Res Function(AssistantFinishedResult) then) =
      _$AssistantFinishedResultCopyWithImpl<$Res>;
}

/// @nodoc
class _$AssistantFinishedResultCopyWithImpl<$Res>
    implements $AssistantFinishedResultCopyWith<$Res> {
  _$AssistantFinishedResultCopyWithImpl(this._value, this._then);

  final AssistantFinishedResult _value;
  // ignore: unused_field
  final $Res Function(AssistantFinishedResult) _then;
}

/// @nodoc
abstract class _$AssistantFinishedResultFallbackCopyWith<$Res> {
  factory _$AssistantFinishedResultFallbackCopyWith(
          _AssistantFinishedResultFallback value,
          $Res Function(_AssistantFinishedResultFallback) then) =
      __$AssistantFinishedResultFallbackCopyWithImpl<$Res>;
}

/// @nodoc
class __$AssistantFinishedResultFallbackCopyWithImpl<$Res>
    extends _$AssistantFinishedResultCopyWithImpl<$Res>
    implements _$AssistantFinishedResultFallbackCopyWith<$Res> {
  __$AssistantFinishedResultFallbackCopyWithImpl(
      _AssistantFinishedResultFallback _value,
      $Res Function(_AssistantFinishedResultFallback) _then)
      : super(_value, (v) => _then(v as _AssistantFinishedResultFallback));

  @override
  _AssistantFinishedResultFallback get _value =>
      super._value as _AssistantFinishedResultFallback;
}

/// @nodoc

class _$_AssistantFinishedResultFallback
    extends _AssistantFinishedResultFallback {
  _$_AssistantFinishedResultFallback() : super._();

  @override
  String toString() {
    return 'AssistantFinishedResult.fallback()';
  }

  @override
  bool operator ==(dynamic other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _AssistantFinishedResultFallback);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() fallback,
    required TResult Function(String token) done,
  }) {
    return fallback();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult Function()? fallback,
    TResult Function(String token)? done,
  }) {
    return fallback?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? fallback,
    TResult Function(String token)? done,
    required TResult orElse(),
  }) {
    if (fallback != null) {
      return fallback();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_AssistantFinishedResultFallback value) fallback,
    required TResult Function(_AssistantFinishedResultDone value) done,
  }) {
    return fallback(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult Function(_AssistantFinishedResultFallback value)? fallback,
    TResult Function(_AssistantFinishedResultDone value)? done,
  }) {
    return fallback?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_AssistantFinishedResultFallback value)? fallback,
    TResult Function(_AssistantFinishedResultDone value)? done,
    required TResult orElse(),
  }) {
    if (fallback != null) {
      return fallback(this);
    }
    return orElse();
  }
}

abstract class _AssistantFinishedResultFallback
    extends AssistantFinishedResult {
  factory _AssistantFinishedResultFallback() =
      _$_AssistantFinishedResultFallback;
  _AssistantFinishedResultFallback._() : super._();
}

/// @nodoc
abstract class _$AssistantFinishedResultDoneCopyWith<$Res> {
  factory _$AssistantFinishedResultDoneCopyWith(
          _AssistantFinishedResultDone value,
          $Res Function(_AssistantFinishedResultDone) then) =
      __$AssistantFinishedResultDoneCopyWithImpl<$Res>;
  $Res call({String token});
}

/// @nodoc
class __$AssistantFinishedResultDoneCopyWithImpl<$Res>
    extends _$AssistantFinishedResultCopyWithImpl<$Res>
    implements _$AssistantFinishedResultDoneCopyWith<$Res> {
  __$AssistantFinishedResultDoneCopyWithImpl(
      _AssistantFinishedResultDone _value,
      $Res Function(_AssistantFinishedResultDone) _then)
      : super(_value, (v) => _then(v as _AssistantFinishedResultDone));

  @override
  _AssistantFinishedResultDone get _value =>
      super._value as _AssistantFinishedResultDone;

  @override
  $Res call({
    Object? token = freezed,
  }) {
    return _then(_AssistantFinishedResultDone(
      token: token == freezed
          ? _value.token
          : token // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$_AssistantFinishedResultDone extends _AssistantFinishedResultDone {
  _$_AssistantFinishedResultDone({required this.token}) : super._();

  @override
  final String token;

  @override
  String toString() {
    return 'AssistantFinishedResult.done(token: $token)';
  }

  @override
  bool operator ==(dynamic other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _AssistantFinishedResultDone &&
            const DeepCollectionEquality().equals(other.token, token));
  }

  @override
  int get hashCode =>
      Object.hash(runtimeType, const DeepCollectionEquality().hash(token));

  @JsonKey(ignore: true)
  @override
  _$AssistantFinishedResultDoneCopyWith<_AssistantFinishedResultDone>
      get copyWith => __$AssistantFinishedResultDoneCopyWithImpl<
          _AssistantFinishedResultDone>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() fallback,
    required TResult Function(String token) done,
  }) {
    return done(token);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult Function()? fallback,
    TResult Function(String token)? done,
  }) {
    return done?.call(token);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? fallback,
    TResult Function(String token)? done,
    required TResult orElse(),
  }) {
    if (done != null) {
      return done(token);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_AssistantFinishedResultFallback value) fallback,
    required TResult Function(_AssistantFinishedResultDone value) done,
  }) {
    return done(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult Function(_AssistantFinishedResultFallback value)? fallback,
    TResult Function(_AssistantFinishedResultDone value)? done,
  }) {
    return done?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_AssistantFinishedResultFallback value)? fallback,
    TResult Function(_AssistantFinishedResultDone value)? done,
    required TResult orElse(),
  }) {
    if (done != null) {
      return done(this);
    }
    return orElse();
  }
}

abstract class _AssistantFinishedResultDone extends AssistantFinishedResult {
  factory _AssistantFinishedResultDone({required String token}) =
      _$_AssistantFinishedResultDone;
  _AssistantFinishedResultDone._() : super._();

  String get token;
  @JsonKey(ignore: true)
  _$AssistantFinishedResultDoneCopyWith<_AssistantFinishedResultDone>
      get copyWith => throw _privateConstructorUsedError;
}
