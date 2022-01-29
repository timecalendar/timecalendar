import 'package:flutter/foundation.dart';
import 'package:timecalendar/models/event.dart';

class Unit {
  final int id;
  final String name;
  final String color;
  final Event calendar;
  final int gradeId;
  final int lastUpdate;
  final bool visible;
  final String typeUnitCode;
  final String typeUnitName;
  final int typeUnitOrder;

  Unit({
    @required this.id,
    @required this.name,
    @required this.color,
    this.calendar,
    @required this.gradeId,
    @required this.lastUpdate,
    @required this.visible,
    @required this.typeUnitCode,
    @required this.typeUnitName,
    @required this.typeUnitOrder,
  });

  factory Unit.fromInternalDb(Map<String, dynamic> dbMap) {
    Map<String, dynamic> map = Map.from(dbMap);
    return Unit(
      id: map['id'],
      name: map['name'],
      color: map['color'],
      gradeId: map['gradeId'],
      lastUpdate: map['lastUpdate'],
      typeUnitCode: map['typeUnitCode'],
      typeUnitName: map['typeUnitName'],
      typeUnitOrder: map['typeUnitOrder'],
      visible: (map['visible'] == 1) ? true : false,
    );
  }

  factory Unit.fromApi(Map<String, dynamic> map) {
    return Unit(
      id: map['id'],
      name: map['name'],
      color: map['color'],
      gradeId: map['grade_id'],
      lastUpdate: map['last_update'],
      typeUnitCode: map['typeunit_code'],
      typeUnitName: map['typeunit_name'],
      typeUnitOrder: map['typeunit_displayorder'],
      visible: (map['visible'] == 1) ? true : false,
    );
  }

  Map<String, dynamic> toMap() {
    Map<String, dynamic> map = {
      'id': id,
      'name': name,
      'color': color,
      'gradeId': gradeId,
      'lastUpdate': lastUpdate,
      'typeUnitCode': typeUnitCode,
      'typeUnitName': typeUnitName,
      'typeUnitOrder': typeUnitOrder,
      'visible': visible,
    };
    return map;
  }

  @override
  String toString() {
    return toMap().toString();
  }

  static int compare(Unit a, Unit b) {
    if (a.typeUnitOrder != b.typeUnitOrder) {
      return a.typeUnitOrder.compareTo(b.typeUnitOrder);
    } else {
      return a.name.compareTo(b.name);
    }
  }
}
