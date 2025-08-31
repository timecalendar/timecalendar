import 'package:built_collection/built_collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/shared/clients/timecalendar_client.dart';
import 'package:timecalendar/modules/shared/utils/string_includes.dart';
import 'package:timecalendar_api/timecalendar_api.dart';

class SchoolSelectionController
    extends StateNotifier<AsyncValue<BuiltList<SchoolForList>>> {
  final ApiClient client;

  SchoolSelectionController({required this.client})
    : super(AsyncValue.loading());

  Future<BuiltList<SchoolForList>> fetch() async {
    try {
      final rep = await client.schoolsApi().findSchools();
      final schools = rep.data!.schools;
      if (mounted) state = AsyncValue.data(schools);
      return schools;
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
      throw e;
    }
  }
}

final schoolSelectionControllerProvider =
    StateNotifierProvider<
      SchoolSelectionController,
      AsyncValue<BuiltList<SchoolForList>>
    >((ref) {
      return SchoolSelectionController(client: ref.read(apiClientProvider))
        ..fetch();
    });

final schoolSearchProvider = StateProvider.autoDispose<String>((ref) => '');

final schoolFilteredProvider = Provider.autoDispose<BuiltList<SchoolForList>>((
  ref,
) {
  final schools = ref.watch(schoolSelectionControllerProvider);
  final search = ref.watch(schoolSearchProvider);

  return schools.whenOrNull(
        data: (schools) => schools
            .where(
              (item) =>
                  stringIncludes(search, item.name) ||
                  stringIncludes(search, item.code),
            )
            .toBuiltList(),
      ) ??
      BuiltList<SchoolForList>();
});
