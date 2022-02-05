import 'package:diacritic/diacritic.dart';
import 'package:flutter/material.dart';
import 'package:timecalendar/database/schools_manager.dart';
import 'package:timecalendar/modules/school/models/school.dart';

class OLD_SchoolProvider with ChangeNotifier {
  // Initialization
  List<School> _schools = [];
  List<School> _schoolsFiltered = [];

  // End of initialization

  // Getter
  List<School> get schools => _schoolsFiltered;

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
    notifyListeners();
  }

  /// Load schools from api and save it in the database
  Future<void> fetchAndSetSchools() async {
    try {
      // final rep = await http.get(Uri.parse(Environment.oldApiUrl + '/schools'));
      // List<dynamic> rawSchools = jsonDecode(rep.body);

      // var schoolManager = SchoolsManager();
      // await schoolManager.setSchools(
      //     rawSchools.map((item) => School.oldFromApi(item)).toList());

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
