// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'calendar_event_for_public_fields.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CalendarEventForPublicFields extends CalendarEventForPublicFields {
  @override
  final bool? canceled;
  @override
  final String? shortDescription;
  @override
  final String? subject;
  @override
  final String? groupColor;

  factory _$CalendarEventForPublicFields(
          [void Function(CalendarEventForPublicFieldsBuilder)? updates]) =>
      (new CalendarEventForPublicFieldsBuilder()..update(updates))._build();

  _$CalendarEventForPublicFields._(
      {this.canceled, this.shortDescription, this.subject, this.groupColor})
      : super._();

  @override
  CalendarEventForPublicFields rebuild(
          void Function(CalendarEventForPublicFieldsBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CalendarEventForPublicFieldsBuilder toBuilder() =>
      new CalendarEventForPublicFieldsBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CalendarEventForPublicFields &&
        canceled == other.canceled &&
        shortDescription == other.shortDescription &&
        subject == other.subject &&
        groupColor == other.groupColor;
  }

  @override
  int get hashCode {
    return $jf($jc(
        $jc($jc($jc(0, canceled.hashCode), shortDescription.hashCode),
            subject.hashCode),
        groupColor.hashCode));
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CalendarEventForPublicFields')
          ..add('canceled', canceled)
          ..add('shortDescription', shortDescription)
          ..add('subject', subject)
          ..add('groupColor', groupColor))
        .toString();
  }
}

class CalendarEventForPublicFieldsBuilder
    implements
        Builder<CalendarEventForPublicFields,
            CalendarEventForPublicFieldsBuilder> {
  _$CalendarEventForPublicFields? _$v;

  bool? _canceled;
  bool? get canceled => _$this._canceled;
  set canceled(bool? canceled) => _$this._canceled = canceled;

  String? _shortDescription;
  String? get shortDescription => _$this._shortDescription;
  set shortDescription(String? shortDescription) =>
      _$this._shortDescription = shortDescription;

  String? _subject;
  String? get subject => _$this._subject;
  set subject(String? subject) => _$this._subject = subject;

  String? _groupColor;
  String? get groupColor => _$this._groupColor;
  set groupColor(String? groupColor) => _$this._groupColor = groupColor;

  CalendarEventForPublicFieldsBuilder() {
    CalendarEventForPublicFields._defaults(this);
  }

  CalendarEventForPublicFieldsBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _canceled = $v.canceled;
      _shortDescription = $v.shortDescription;
      _subject = $v.subject;
      _groupColor = $v.groupColor;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CalendarEventForPublicFields other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$CalendarEventForPublicFields;
  }

  @override
  void update(void Function(CalendarEventForPublicFieldsBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CalendarEventForPublicFields build() => _build();

  _$CalendarEventForPublicFields _build() {
    final _$result = _$v ??
        new _$CalendarEventForPublicFields._(
            canceled: canceled,
            shortDescription: shortDescription,
            subject: subject,
            groupColor: groupColor);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: always_put_control_body_on_new_line,always_specify_types,annotate_overrides,avoid_annotating_with_dynamic,avoid_as,avoid_catches_without_on_clauses,avoid_returning_this,deprecated_member_use_from_same_package,lines_longer_than_80_chars,no_leading_underscores_for_local_identifiers,omit_local_variable_types,prefer_expression_function_bodies,sort_constructors_first,test_types_in_equals,unnecessary_const,unnecessary_new,unnecessary_lambdas
