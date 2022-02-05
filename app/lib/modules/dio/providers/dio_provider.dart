import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timecalendar/constants/environment.dart';

final dioProvider = Provider(
  (ref) => Dio(
    BaseOptions(
      baseUrl: Environment.mainApiUrl,
    ),
  ),
);
