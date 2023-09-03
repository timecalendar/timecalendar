// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'orleans_get_ical_url_from_student_number_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$OrleansGetIcalUrlFromStudentNumberDto
    extends OrleansGetIcalUrlFromStudentNumberDto {
  @override
  final String studentNumber;

  factory _$OrleansGetIcalUrlFromStudentNumberDto(
          [void Function(OrleansGetIcalUrlFromStudentNumberDtoBuilder)?
              updates]) =>
      (new OrleansGetIcalUrlFromStudentNumberDtoBuilder()..update(updates))
          ._build();

  _$OrleansGetIcalUrlFromStudentNumberDto._({required this.studentNumber})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(studentNumber,
        r'OrleansGetIcalUrlFromStudentNumberDto', 'studentNumber');
  }

  @override
  OrleansGetIcalUrlFromStudentNumberDto rebuild(
          void Function(OrleansGetIcalUrlFromStudentNumberDtoBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  OrleansGetIcalUrlFromStudentNumberDtoBuilder toBuilder() =>
      new OrleansGetIcalUrlFromStudentNumberDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is OrleansGetIcalUrlFromStudentNumberDto &&
        studentNumber == other.studentNumber;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, studentNumber.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'OrleansGetIcalUrlFromStudentNumberDto')
          ..add('studentNumber', studentNumber))
        .toString();
  }
}

class OrleansGetIcalUrlFromStudentNumberDtoBuilder
    implements
        Builder<OrleansGetIcalUrlFromStudentNumberDto,
            OrleansGetIcalUrlFromStudentNumberDtoBuilder> {
  _$OrleansGetIcalUrlFromStudentNumberDto? _$v;

  String? _studentNumber;
  String? get studentNumber => _$this._studentNumber;
  set studentNumber(String? studentNumber) =>
      _$this._studentNumber = studentNumber;

  OrleansGetIcalUrlFromStudentNumberDtoBuilder() {
    OrleansGetIcalUrlFromStudentNumberDto._defaults(this);
  }

  OrleansGetIcalUrlFromStudentNumberDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _studentNumber = $v.studentNumber;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(OrleansGetIcalUrlFromStudentNumberDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$OrleansGetIcalUrlFromStudentNumberDto;
  }

  @override
  void update(
      void Function(OrleansGetIcalUrlFromStudentNumberDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  OrleansGetIcalUrlFromStudentNumberDto build() => _build();

  _$OrleansGetIcalUrlFromStudentNumberDto _build() {
    final _$result = _$v ??
        new _$OrleansGetIcalUrlFromStudentNumberDto._(
            studentNumber: BuiltValueNullFieldError.checkNotNull(studentNumber,
                r'OrleansGetIcalUrlFromStudentNumberDto', 'studentNumber'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
