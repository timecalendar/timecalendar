import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/school/clients/school_client.dart';
import 'package:timecalendar/modules/school/models/school.dart';
import 'package:timecalendar/modules/shared/utils/string_includes.dart';

class SchoolSelectionController
    extends StateNotifier<AsyncValue<List<School>>> {
  final SchoolClient client;

  SchoolSelectionController({
    required this.client,
  }) : super(AsyncValue.loading());

  Future<List<School>> fetch() async {
    try {
      final schools = await client.fetchSchools();
      if (mounted) state = AsyncValue.data(schools);
      return schools;
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace: stackTrace);
      throw e;
    }
  }
}

final schoolSelectionControllerProvider =
    StateNotifierProvider<SchoolSelectionController, AsyncValue<List<School>>>(
        (ref) {
  return SchoolSelectionController(client: ref.read(schoolClientProvider))
    ..fetch();
});

final schoolSearchProvider = StateProvider((ref) => '');

final schoolFilteredProvider = Provider<List<School>>((ref) {
  final schools = ref.watch(schoolSelectionControllerProvider);
  final search = ref.watch(schoolSearchProvider);

  return schools.whenOrNull(
        data: (schools) => schools
            .where(
              (item) =>
                  stringIncludes(search, item.name) ||
                  stringIncludes(search, item.code),
            )
            .toList(),
      ) ??
      [];
});
