import 'package:flutter/foundation.dart';

class Grade {
  final int id;
  final String schoolCode;
  final String name;
  final bool weekend;

  Grade({
    @required this.id,
    @required this.schoolCode,
    @required this.name,
    @required this.weekend,
  });

  factory Grade.fromInternalDb(Map<String, dynamic> dbMap) {
    Map<String, dynamic> map = Map.from(dbMap);
    return Grade(
      id: map['id'],
      schoolCode: map['schoolCode'],
      name: map['name'],
      weekend: (map['weekend'] == 1) ? true : false,
    );
  }

  factory Grade.fromApi(Map<String, dynamic> map) {
    return Grade(
      id: map['id'],
      schoolCode: map['school_code'],
      name: map['name'],
      weekend: (map['weekend'] == 1) ? true : false,
    );
  }

  Map<String, dynamic> toMap() {
    Map<String, dynamic> map = {
      'id': id,
      'schoolCode': schoolCode,
      'name': name,
      'weekend': weekend,
    };
    return map;
  }

  @override
  String toString() {
    return toMap().toString();
  }
}
