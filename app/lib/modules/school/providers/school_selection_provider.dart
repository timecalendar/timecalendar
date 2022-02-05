import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/school/providers/school_client_provider.dart';

final schoolListProvider = FutureProvider((ref) async {
  final client = ref.read(schoolClientProvider);
  print('provider');

  final schools = await client.fetchSchools();

  print(schools);

  return schools;
});
