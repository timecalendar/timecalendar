import 'dart:convert';

/// Decodes an EncodedToken
///
/// Documentation: https://timecalendar.app/apidoc/#section/EncodedToken
String calendarDecode(String calendarToken) {
  try {
    return utf8.decode(base64.decode(calendarToken
        .replaceAll('-', '+')
        .replaceAll('_', '/')
        .replaceAll('~', '=')));
  } on Exception {
    return '';
  }
}

/// Decodes and EncodedToken and returns a map with associated calendars
///
/// Map key is the calendar token and value is a boolean which indicates
/// whether it is activated or not.
Map<String, bool> decodeEncodedToken(String encodedToken) {
  Map<String, bool> calendarsMap = {};

  final decoded = calendarDecode(encodedToken);
  final calendars = decoded.split('-');

  for (final token in calendars) {
    final splitted = token.split(':');
    if (splitted.length != 2) continue;
    calendarsMap[splitted[0]] = splitted[1] == '1';
  }

  return calendarsMap;
}
