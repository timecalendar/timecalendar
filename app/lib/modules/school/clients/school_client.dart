import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timecalendar/modules/dio/providers/dio_provider.dart';

class SchoolClient {
  Reader _read;

  SchoolClient(this._read);

  fetchSchools() {
    _read(dioProvider);
  }
}
