// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_calendar_rep_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateCalendarRepDto extends CreateCalendarRepDto {
  @override
  final String id;

  factory _$CreateCalendarRepDto(
          [void Function(CreateCalendarRepDtoBuilder)? updates]) =>
      (new CreateCalendarRepDtoBuilder()..update(updates))._build();

  _$CreateCalendarRepDto._({required this.id}) : super._() {
    BuiltValueNullFieldError.checkNotNull(id, r'CreateCalendarRepDto', 'id');
  }

  @override
  CreateCalendarRepDto rebuild(
          void Function(CreateCalendarRepDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateCalendarRepDtoBuilder toBuilder() =>
      new CreateCalendarRepDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateCalendarRepDto && id == other.id;
  }

  @override
  int get hashCode {
    return $jf($jc(0, id.hashCode));
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateCalendarRepDto')..add('id', id))
        .toString();
  }
}

class CreateCalendarRepDtoBuilder
    implements Builder<CreateCalendarRepDto, CreateCalendarRepDtoBuilder> {
  _$CreateCalendarRepDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  CreateCalendarRepDtoBuilder() {
    CreateCalendarRepDto._defaults(this);
  }

  CreateCalendarRepDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateCalendarRepDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$CreateCalendarRepDto;
  }

  @override
  void update(void Function(CreateCalendarRepDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateCalendarRepDto build() => _build();

  _$CreateCalendarRepDto _build() {
    final _$result = _$v ??
        new _$CreateCalendarRepDto._(
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'CreateCalendarRepDto', 'id'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: always_put_control_body_on_new_line,always_specify_types,annotate_overrides,avoid_annotating_with_dynamic,avoid_as,avoid_catches_without_on_clauses,avoid_returning_this,deprecated_member_use_from_same_package,lines_longer_than_80_chars,no_leading_underscores_for_local_identifiers,omit_local_variable_types,prefer_expression_function_bodies,sort_constructors_first,test_types_in_equals,unnecessary_const,unnecessary_new,unnecessary_lambdas