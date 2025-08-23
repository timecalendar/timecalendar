// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'calendar_event_custom_fields.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CalendarEventCustomFields extends CalendarEventCustomFields {
  @override
  final bool? canceled;
  @override
  final String? shortDescription;
  @override
  final String? subject;
  @override
  final String? groupColor;

  factory _$CalendarEventCustomFields(
          [void Function(CalendarEventCustomFieldsBuilder)? updates]) =>
      (CalendarEventCustomFieldsBuilder()..update(updates))._build();

  _$CalendarEventCustomFields._(
      {this.canceled, this.shortDescription, this.subject, this.groupColor})
      : super._();
  @override
  CalendarEventCustomFields rebuild(
          void Function(CalendarEventCustomFieldsBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CalendarEventCustomFieldsBuilder toBuilder() =>
      CalendarEventCustomFieldsBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CalendarEventCustomFields &&
        canceled == other.canceled &&
        shortDescription == other.shortDescription &&
        subject == other.subject &&
        groupColor == other.groupColor;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, canceled.hashCode);
    _$hash = $jc(_$hash, shortDescription.hashCode);
    _$hash = $jc(_$hash, subject.hashCode);
    _$hash = $jc(_$hash, groupColor.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CalendarEventCustomFields')
          ..add('canceled', canceled)
          ..add('shortDescription', shortDescription)
          ..add('subject', subject)
          ..add('groupColor', groupColor))
        .toString();
  }
}

class CalendarEventCustomFieldsBuilder
    implements
        Builder<CalendarEventCustomFields, CalendarEventCustomFieldsBuilder> {
  _$CalendarEventCustomFields? _$v;

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

  CalendarEventCustomFieldsBuilder() {
    CalendarEventCustomFields._defaults(this);
  }

  CalendarEventCustomFieldsBuilder get _$this {
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
  void replace(CalendarEventCustomFields other) {
    _$v = other as _$CalendarEventCustomFields;
  }

  @override
  void update(void Function(CalendarEventCustomFieldsBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CalendarEventCustomFields build() => _build();

  _$CalendarEventCustomFields _build() {
    final _$result = _$v ??
        _$CalendarEventCustomFields._(
          canceled: canceled,
          shortDescription: shortDescription,
          subject: subject,
          groupColor: groupColor,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
