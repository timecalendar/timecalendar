import 'package:timecalendar_api/timecalendar_api.dart';

class UserCalendar {
  String id;
  String name;
  String token;
  String? schoolName;
  String schoolId;
  DateTime lastUpdatedAt;
  DateTime createdAt;

  UserCalendar({
    required this.id,
    required this.name,
    required this.token,
    required this.schoolName,
    required this.schoolId,
    required this.lastUpdatedAt,
    required this.createdAt,
  });

  factory UserCalendar.fromInternalDb(Map<String, dynamic> dbMap) {
    Map<String, dynamic> map = Map.from(dbMap);
    return UserCalendar(
      id: map['id'],
      name: map['name'],
      token: map['token'],
      schoolName: map['schoolName'],
      schoolId: map['schoolId'],
      lastUpdatedAt: DateTime.parse(map['lastUpdatedAt']),
      createdAt: DateTime.parse(map['createdAt']),
    );
  }

  factory UserCalendar.fromCalendarForPublic(CalendarForPublic calendar) {
    return UserCalendar(
      id: calendar.id,
      name: calendar.name,
      token: calendar.token,
      schoolName: calendar.schoolName,
      schoolId: calendar.schoolId,
      lastUpdatedAt: calendar.lastUpdatedAt,
      createdAt: calendar.createdAt,
    );
  }

  Map<String, dynamic> toDbMap() {
    return {
      'id': id,
      'name': name,
      'token': token,
      'schoolName': schoolName,
      'schoolId': schoolId,
      'lastUpdatedAt': lastUpdatedAt.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
    };
  }

  @override
  String toString() {
    return toDbMap().toString();
  }
}
