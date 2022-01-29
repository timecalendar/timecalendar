import 'dart:convert';

import 'package:diacritic/diacritic.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:timecalendar/constants/environment.dart';
import 'package:timecalendar/database/grades_manager.dart';
import 'package:timecalendar/database/schools_manager.dart';
import 'package:timecalendar/database/units_manager.dart';
import 'package:timecalendar/models/grade.dart';
import 'package:timecalendar/models/list_item.dart';
import 'package:timecalendar/models/school.dart';
import 'package:timecalendar/models/unit.dart';
import 'package:timecalendar/models/unit_heading_item.dart';
import 'package:timecalendar/models/unit_item.dart';

class SchoolProvider with ChangeNotifier {
  // Initialization
  List<School> _schools = [];
  List<School> _schoolsFiltered = [];
  School _selectedSchool;

  List<Grade> _grades = [];
  List<Grade> _gradesFiltered = [];
  Grade _selectedGrade;

  List<Unit> _units = [];
  List<ListItem> _unitsFiltered = [];
  List<Unit> _selectedUnits = [];

  // End of initialization

  // Getter
  List<School> get schools => _schoolsFiltered;
  List<Grade> get grades => _gradesFiltered;
  List<ListItem> get units => _unitsFiltered;
  School get selectedSchool => _selectedSchool;
  Grade get selectedGrade => _selectedGrade;
  List<Unit> get selectedUnits => _selectedUnits;

  // End of getter

  // Methods

  /// Load schools from database and api
  Future<void> loadSchools() async {
    try {
      await loadSchoolFromDatabase();
      await fetchAndSetSchools();
    } on Exception catch (error) {
      throw error;
    }
  }

  /// Load schools from database
  Future<void> loadSchoolFromDatabase() async {
    _schools = await SchoolsManager().getSchools();
    _schools
        .sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
    _schoolsFiltered = [..._schools];
    _gradesFiltered = [];
    _unitsFiltered = [];
    notifyListeners();
  }

  /// Load schools from api and save it in the database
  Future<void> fetchAndSetSchools() async {
    try {
      final rep =
          await http.get(Uri.parse(Environment.mainApiUrl + '/schools'));
      List<dynamic> rawSchools = jsonDecode(rep.body);

      var schoolManager = SchoolsManager();
      await schoolManager
          .setSchools(rawSchools.map((item) => School.fromApi(item)).toList());

      await loadSchoolFromDatabase();
    } on Exception catch (error) {
      throw error;
    }
  }

  Future<void> filterSchool(String filter) async {
    _schoolsFiltered = _schools
        .where((item) =>
            includes(filter, item.name) || includes(filter, item.code))
        .toList();
    notifyListeners();
  }

  /// Load grades from database and api
  Future<void> loadGrades() async {
    if (_selectedSchool != null) {
      try {
        await loadGradesFromDatabase();
        await fetchAndSetGrades();
      } on Exception catch (error) {
        throw error;
      }
    }
  }

  /// Load grades from database
  Future<void> loadGradesFromDatabase() async {
    _grades = await GradesManager().getGradesFromSchool(_selectedSchool.code);
    _grades
        .sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
    _gradesFiltered = [..._grades];
    _unitsFiltered = [];
    notifyListeners();
  }

  /// Load grades from API
  Future<void> fetchAndSetGrades() async {
    try {
      final rep = await http.get(Uri.parse(Environment.mainApiUrl +
          '/schools/' +
          _selectedSchool.code +
          '/grades'));
      List<dynamic> rawGrades = jsonDecode(rep.body);

      var gradeManager = GradesManager();
      await gradeManager.setGradesFromSchool(
        _selectedSchool.code,
        rawGrades.map((item) => Grade.fromApi(item)).toList(),
      );

      await loadGradesFromDatabase();
    } on Exception catch (error) {
      throw error;
    }
  }

  Future<void> filterGrade(String filter) async {
    _gradesFiltered =
        _grades.where((item) => includes(filter, item.name)).toList();
    notifyListeners();
  }

  Future<bool> setSelectedSchool(School school) async {
    _selectedSchool = school;
    return _gradesFiltered.length > 0;
  }

  Future<void> loadUnitsFromDatabase() async {
    _units = await UnitsManager().getUnitsFromGrades(_selectedGrade.id);
    _units.sort((a, b) => Unit.compare(a, b));
    filterUnits();
    notifyListeners();
  }

  Future<void> fetchAndSetUnits() async {
    try {
      final rep = await http.get(Uri.parse(Environment.mainApiUrl +
          '/schools/' +
          _selectedSchool.code +
          '/grades/' +
          _selectedGrade.id.toString() +
          '/gradeunits'));
      List<dynamic> rawUnits = jsonDecode(rep.body);

      var unitManager = UnitsManager();
      await unitManager.setUnitsFromGrades(
        _selectedGrade.id,
        rawUnits.map((item) => Unit.fromApi(item)).toList(),
      );

      await loadUnitsFromDatabase();
    } on Exception catch (error) {
      throw error;
    }
  }

  Future<void> loadUnits() async {
    if (_selectedGrade != null) {
      try {
        await loadUnitsFromDatabase();
        await fetchAndSetUnits();
      } on Exception catch (error) {
        throw error;
      }
    }
  }

  Future<void> setSelectedGrade(Grade grade) async {
    _selectedGrade = grade;
    _selectedUnits = [];
  }

  void toggleUnit(Unit unit) {
    int index = _selectedUnits.indexOf(unit);
    if (index >= 0) {
      _selectedUnits.removeAt(index);
    } else {
      _selectedUnits.add(unit);
    }
    notifyListeners();
  }

  bool isSelectedUnit(Unit unit) {
    return _selectedUnits.contains(unit);
  }

  Future<void> saveSelectedUnits() async {
    if (this.selectedUnits.length == 0) {
      return;
    }
    try {
      // Save selected units in database
      await UnitsManager().saveSelectedUnits(this.selectedUnits);
    } on Exception catch (error) {
      throw error;
    }
  }

  void filterUnits({String filter = ''}) {
    _unitsFiltered = [];
    bool enableSearch = filter.length > 0;
    String previousTypeUnit;
    for (Unit unit in _units) {
      if (unit.typeUnitName != previousTypeUnit) {
        // Create heading
        _unitsFiltered.add(UnitHeadingItem(unit.typeUnitName));
        previousTypeUnit = unit.typeUnitName;
      }

      if (!enableSearch || enableSearch && includes(filter, unit.name)) {
        _unitsFiltered.add(UnitItem(unit));
      }
    }
  }

  bool includes(String needle, String haystack) {
    needle = removeDiacritics(needle);
    haystack = removeDiacritics(haystack);

    needle = needle.replaceAll(RegExp(r'[ -]'), '');
    haystack = haystack.replaceAll(RegExp(r'[ -]'), '');

    // Escape search
    String search =
        needle.replaceAll(RegExp(r'/[-\/\\$*+?.()|[\]{}]/g'), r'\\$&');

    RegExp regExp = RegExp(search, caseSensitive: false);
    return regExp.hasMatch(haystack);
  }

  // End of methods
}
