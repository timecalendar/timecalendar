import 'package:flutter/foundation.dart';

class HiddenEvent {
  final List<String> uidHiddenEvents;
  final List<String> namedHiddenEvents;

  HiddenEvent({
    @required this.uidHiddenEvents,
    @required this.namedHiddenEvents,
  });

  factory HiddenEvent.fromMap(Map<String, dynamic> map) {
    return HiddenEvent(
      uidHiddenEvents: List<String>.from(map['uidHiddenEvents']),
      namedHiddenEvents: List<String>.from(map['namedHiddenEvents']),
    );
  }

  Map<String, dynamic> toMap() {
    var map = Map<String, dynamic>();
    map['uidHiddenEvents'] = uidHiddenEvents;
    map['namedHiddenEvents'] = namedHiddenEvents;
    return map;
  }

  @override
  String toString() {
    return this.toMap().toString();
  }
}
