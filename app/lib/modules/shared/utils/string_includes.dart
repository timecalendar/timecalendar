import 'package:diacritic/diacritic.dart';

bool stringIncludes(String needle, String haystack) {
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
