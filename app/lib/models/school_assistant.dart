class SchoolAssistant {
  final String? code;
  final bool? isNative;
  final bool? needsConnection;
  final bool? needsGradeName;

  SchoolAssistant({
    this.code,
    this.isNative,
    this.needsConnection,
    this.needsGradeName,
  });

  factory SchoolAssistant.fromInternalDb(Map<String, dynamic> dbMap) {
    Map<String, dynamic> map = Map.from(dbMap);
    return SchoolAssistant(
      code: map['code'],
      isNative: map['isNative'],
      needsConnection: map['needsConnection'],
      needsGradeName: map['needsGradeName'],
    );
  }

  factory SchoolAssistant.fromApi(Map<String, dynamic> dbMap) {
    Map<String, dynamic> map = Map.from(dbMap);
    return SchoolAssistant(
      code: map['code'],
      isNative: map['is_native'],
      needsConnection: map['needs_connection'],
      needsGradeName: map['needs_grade_name'],
    );
  }

  Map<String, dynamic> toMap() {
    Map<String, dynamic> map = {
      'code': code,
      'isNative': isNative,
      'needsConnection': needsConnection,
      'needsGradeName': needsGradeName,
    };
    return map;
  }
}
