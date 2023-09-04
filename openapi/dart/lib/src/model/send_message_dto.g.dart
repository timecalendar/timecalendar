// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'send_message_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SendMessageDto extends SendMessageDto {
  @override
  final String email;
  @override
  final String message;
  @override
  final BuiltList<String>? calendarIds;
  @override
  final String? schoolId;
  @override
  final String? schoolName;
  @override
  final String? gradeName;
  @override
  final String? deviceInfo;
  @override
  final String? calendarUrl;

  factory _$SendMessageDto([void Function(SendMessageDtoBuilder)? updates]) =>
      (new SendMessageDtoBuilder()..update(updates))._build();

  _$SendMessageDto._(
      {required this.email,
      required this.message,
      this.calendarIds,
      this.schoolId,
      this.schoolName,
      this.gradeName,
      this.deviceInfo,
      this.calendarUrl})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(email, r'SendMessageDto', 'email');
    BuiltValueNullFieldError.checkNotNull(
        message, r'SendMessageDto', 'message');
  }

  @override
  SendMessageDto rebuild(void Function(SendMessageDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SendMessageDtoBuilder toBuilder() =>
      new SendMessageDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SendMessageDto &&
        email == other.email &&
        message == other.message &&
        calendarIds == other.calendarIds &&
        schoolId == other.schoolId &&
        schoolName == other.schoolName &&
        gradeName == other.gradeName &&
        deviceInfo == other.deviceInfo &&
        calendarUrl == other.calendarUrl;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, email.hashCode);
    _$hash = $jc(_$hash, message.hashCode);
    _$hash = $jc(_$hash, calendarIds.hashCode);
    _$hash = $jc(_$hash, schoolId.hashCode);
    _$hash = $jc(_$hash, schoolName.hashCode);
    _$hash = $jc(_$hash, gradeName.hashCode);
    _$hash = $jc(_$hash, deviceInfo.hashCode);
    _$hash = $jc(_$hash, calendarUrl.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SendMessageDto')
          ..add('email', email)
          ..add('message', message)
          ..add('calendarIds', calendarIds)
          ..add('schoolId', schoolId)
          ..add('schoolName', schoolName)
          ..add('gradeName', gradeName)
          ..add('deviceInfo', deviceInfo)
          ..add('calendarUrl', calendarUrl))
        .toString();
  }
}

class SendMessageDtoBuilder
    implements Builder<SendMessageDto, SendMessageDtoBuilder> {
  _$SendMessageDto? _$v;

  String? _email;
  String? get email => _$this._email;
  set email(String? email) => _$this._email = email;

  String? _message;
  String? get message => _$this._message;
  set message(String? message) => _$this._message = message;

  ListBuilder<String>? _calendarIds;
  ListBuilder<String> get calendarIds =>
      _$this._calendarIds ??= new ListBuilder<String>();
  set calendarIds(ListBuilder<String>? calendarIds) =>
      _$this._calendarIds = calendarIds;

  String? _schoolId;
  String? get schoolId => _$this._schoolId;
  set schoolId(String? schoolId) => _$this._schoolId = schoolId;

  String? _schoolName;
  String? get schoolName => _$this._schoolName;
  set schoolName(String? schoolName) => _$this._schoolName = schoolName;

  String? _gradeName;
  String? get gradeName => _$this._gradeName;
  set gradeName(String? gradeName) => _$this._gradeName = gradeName;

  String? _deviceInfo;
  String? get deviceInfo => _$this._deviceInfo;
  set deviceInfo(String? deviceInfo) => _$this._deviceInfo = deviceInfo;

  String? _calendarUrl;
  String? get calendarUrl => _$this._calendarUrl;
  set calendarUrl(String? calendarUrl) => _$this._calendarUrl = calendarUrl;

  SendMessageDtoBuilder() {
    SendMessageDto._defaults(this);
  }

  SendMessageDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _email = $v.email;
      _message = $v.message;
      _calendarIds = $v.calendarIds?.toBuilder();
      _schoolId = $v.schoolId;
      _schoolName = $v.schoolName;
      _gradeName = $v.gradeName;
      _deviceInfo = $v.deviceInfo;
      _calendarUrl = $v.calendarUrl;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SendMessageDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$SendMessageDto;
  }

  @override
  void update(void Function(SendMessageDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SendMessageDto build() => _build();

  _$SendMessageDto _build() {
    _$SendMessageDto _$result;
    try {
      _$result = _$v ??
          new _$SendMessageDto._(
              email: BuiltValueNullFieldError.checkNotNull(
                  email, r'SendMessageDto', 'email'),
              message: BuiltValueNullFieldError.checkNotNull(
                  message, r'SendMessageDto', 'message'),
              calendarIds: _calendarIds?.build(),
              schoolId: schoolId,
              schoolName: schoolName,
              gradeName: gradeName,
              deviceInfo: deviceInfo,
              calendarUrl: calendarUrl);
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'calendarIds';
        _calendarIds?.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'SendMessageDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
