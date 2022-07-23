// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'find_schools_rep_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FindSchoolsRepDto extends FindSchoolsRepDto {
  @override
  final BuiltList<SchoolForList> schools;

  factory _$FindSchoolsRepDto(
          [void Function(FindSchoolsRepDtoBuilder)? updates]) =>
      (new FindSchoolsRepDtoBuilder()..update(updates))._build();

  _$FindSchoolsRepDto._({required this.schools}) : super._() {
    BuiltValueNullFieldError.checkNotNull(
        schools, r'FindSchoolsRepDto', 'schools');
  }

  @override
  FindSchoolsRepDto rebuild(void Function(FindSchoolsRepDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  FindSchoolsRepDtoBuilder toBuilder() =>
      new FindSchoolsRepDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FindSchoolsRepDto && schools == other.schools;
  }

  @override
  int get hashCode {
    return $jf($jc(0, schools.hashCode));
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'FindSchoolsRepDto')
          ..add('schools', schools))
        .toString();
  }
}

class FindSchoolsRepDtoBuilder
    implements Builder<FindSchoolsRepDto, FindSchoolsRepDtoBuilder> {
  _$FindSchoolsRepDto? _$v;

  ListBuilder<SchoolForList>? _schools;
  ListBuilder<SchoolForList> get schools =>
      _$this._schools ??= new ListBuilder<SchoolForList>();
  set schools(ListBuilder<SchoolForList>? schools) => _$this._schools = schools;

  FindSchoolsRepDtoBuilder() {
    FindSchoolsRepDto._defaults(this);
  }

  FindSchoolsRepDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _schools = $v.schools.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FindSchoolsRepDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$FindSchoolsRepDto;
  }

  @override
  void update(void Function(FindSchoolsRepDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  FindSchoolsRepDto build() => _build();

  _$FindSchoolsRepDto _build() {
    _$FindSchoolsRepDto _$result;
    try {
      _$result = _$v ?? new _$FindSchoolsRepDto._(schools: schools.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'schools';
        schools.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'FindSchoolsRepDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: always_put_control_body_on_new_line,always_specify_types,annotate_overrides,avoid_annotating_with_dynamic,avoid_as,avoid_catches_without_on_clauses,avoid_returning_this,deprecated_member_use_from_same_package,lines_longer_than_80_chars,no_leading_underscores_for_local_identifiers,omit_local_variable_types,prefer_expression_function_bodies,sort_constructors_first,test_types_in_equals,unnecessary_const,unnecessary_new,unnecessary_lambdas
