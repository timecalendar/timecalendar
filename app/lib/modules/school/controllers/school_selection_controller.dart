import 'package:flutter/material.dart';
import 'package:timecalendar/modules/school/clients/school_client.dart';
import 'package:timecalendar/modules/school/models/school.dart';

class SchoolSelectionController with ChangeNotifier {
  final SchoolClient client;

  List<School> schools = [];

  SchoolSelectionController({
    required this.client,
  });

  void toggle() {
    notifyListeners();
  }
}
