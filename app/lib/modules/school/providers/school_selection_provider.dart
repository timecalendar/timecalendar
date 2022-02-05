import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/school/clients/school_client.dart';

final schoolListProvider = FutureProvider((ref) async {
  final client = ref.read(schoolClientProvider);
  print('provider');

  final schools = await client.fetchSchools();

  print(schools);

  return schools;
});
