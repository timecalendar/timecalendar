import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:tuple/tuple.dart';

import 'event.dart';

class Difference {
  final int id;
  final int unitId;
  final String calendarToken;
  final DateTime dateDiff;
  final List<Event> oldItems;
  final List<Event> newItems;
  final List<Tuple2<Event, Event>> changedItems;

  Difference({
    @required this.id,
    this.unitId,
    this.calendarToken,
    @required this.dateDiff,
    @required this.oldItems,
    @required this.newItems,
    @required this.changedItems,
  });

  factory Difference.fromInternalDb(Map<String, dynamic> dbMap) {
    Map<String, dynamic> map = Map.from(dbMap);
    Map<String, dynamic> diff = jsonDecode(map['diff']);
    return Difference(
      id: map['id'],
      unitId: map['unit_id'],
      calendarToken: map['token'],
      dateDiff: DateTime.fromMillisecondsSinceEpoch(map['dateDiff'] * 1000),
      oldItems: List<Event>.from(
        diff['oldItems'].map(
          (event) => Event.fromDb(event),
        ),
      ).toList(),
      newItems: List<Event>.from(
        diff['newItems'].map(
          (event) => Event.fromDb(event),
        ),
      ).toList(),
      changedItems: List<Tuple2<Event, Event>>.from(
        diff['changedItems'].map((events) {
          var changedEvents = events as List<dynamic>;
          return Tuple2<Event, Event>(
            Event.fromDb(changedEvents[0]),
            Event.fromDb(changedEvents[1]),
          );
        }),
      ).toList(),
    );
  }

  factory Difference.fromApi(Map<String, dynamic> map) {
    var diff = map['diff'];
    return Difference(
      id: map['id'],
      unitId: map['unit_id'],
      calendarToken: map['token'],
      dateDiff: DateTime.fromMillisecondsSinceEpoch(map['dateDiff'] * 1000),
      oldItems: List<Event>.from(
        diff['oldItems'].map(
          (event) => Event.fromApi(event),
        ),
      ).toList(),
      newItems: List<Event>.from(
        diff['newItems'].map(
          (event) => Event.fromApi(event),
        ),
      ).toList(),
      changedItems: List<Tuple2<Event, Event>>.from(
        diff['changedItems'].map((events) {
          var changedEvents = events as List<dynamic>;
          return Tuple2<Event, Event>(
            Event.fromApi(changedEvents[0]),
            Event.fromApi(changedEvents[1]),
          );
        }),
      ).toList(),
    );
  }

  Map<String, dynamic> toMap() {
    Map<String, dynamic> map = {
      'id': id,
      'unit_id': unitId,
      'token': calendarToken,
      'dateDiff': (dateDiff.millisecondsSinceEpoch / 1000).ceil(),
      'diff': jsonEncode({
        'oldItems': oldItems.map((event) => event.toMap()).toList(),
        'newItems': newItems.map((event) => event.toMap()).toList(),
        'changedItems': changedItems
            .map((events) => [events.item1.toMap(), events.item2.toMap()])
            .toList(),
      }),
    };
    return map;
  }

  @override
  String toString() {
    return toMap().toString();
  }
}
