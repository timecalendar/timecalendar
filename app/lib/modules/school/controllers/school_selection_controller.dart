import 'package:built_collection/built_collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:hooks_riverpod/legacy.dart';
import 'package:timecalendar/modules/shared/clients/timecalendar_client.dart';
import 'package:timecalendar/modules/shared/utils/string_includes.dart';
import 'package:timecalendar_api/timecalendar_api.dart';

class SchoolSelectionController
    extends AsyncNotifier<BuiltList<SchoolForList>> {
  @override
  Future<BuiltList<SchoolForList>> build() => _doFetch();

  Future<void> fetch() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(_doFetch);
  }

  Future<BuiltList<SchoolForList>> _doFetch() async {
    final client = ref.read(apiClientProvider);
    final rep = await client.schoolsApi().findSchools();
    return rep.data!.schools;
  }
}

final schoolSelectionControllerProvider =
    AsyncNotifierProvider<SchoolSelectionController, BuiltList<SchoolForList>>(
      SchoolSelectionController.new,
    );

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
