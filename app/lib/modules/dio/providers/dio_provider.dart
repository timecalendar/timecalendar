import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timecalendar/modules/shared/constants/environment.dart';

final dioProvider = Provider(
  (ref) => Dio(
    BaseOptions(
      baseUrl: ref.read(environmentProvider).mainApiUrl,
    ),
  ),
);
