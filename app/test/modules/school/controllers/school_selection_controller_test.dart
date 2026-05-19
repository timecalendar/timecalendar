import 'package:built_collection/built_collection.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:timecalendar/modules/school/controllers/school_selection_controller.dart';
import 'package:timecalendar/modules/shared/clients/timecalendar_client.dart';
import 'package:timecalendar_api/timecalendar_api.dart';

import '../../../support/fixtures.dart';

class MockApiClient extends Mock implements ApiClient {}

class MockSchoolsApi extends Mock implements SchoolsApi {}

/// A [SchoolSelectionController] pre-seeded with data, so `schoolFilteredProvider`
/// can be exercised without driving the async `fetch()`.
class _SeededSchoolController extends SchoolSelectionController {
  _SeededSchoolController(BuiltList<SchoolForList> schools)
    : super(client: MockApiClient()) {
    state = AsyncValue.data(schools);
  }
}

void main() {
  group('SchoolSelectionController.fetch', () {
    test('sets state to AsyncData with the fetched schools', () async {
      final schools = [
        buildSchoolForList(id: 'a', code: 'SORB', name: 'Sorbonne'),
        buildSchoolForList(id: 'b', code: 'XYZ', name: 'Polytechnique'),
      ];
      final client = MockApiClient();
      final schoolsApi = MockSchoolsApi();
      when(() => client.schoolsApi()).thenReturn(schoolsApi);
      when(() => schoolsApi.findSchools()).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/schools'),
          data: buildFindSchoolsRep(schools),
        ),
      );

      final controller = SchoolSelectionController(client: client);
      AsyncValue<BuiltList<SchoolForList>>? observedState;
      controller.addListener((state) => observedState = state);

      final result = await controller.fetch();

      expect(result.map((s) => s.id), ['a', 'b']);
      expect(observedState, isA<AsyncData<BuiltList<SchoolForList>>>());
      expect(observedState!.value, equals(result));
    });
  });

  group('schoolFilteredProvider', () {
    final sorbonne = buildSchoolForList(
      id: 'a',
      code: 'SORB',
      name: 'Sorbonne',
    );
    final polytechnique = buildSchoolForList(
      id: 'b',
      code: 'XYZ',
      name: 'Polytechnique',
    );

    ProviderContainer seededContainer() {
      final container = ProviderContainer(
        overrides: [
          schoolSelectionControllerProvider.overrideWith(
            (ref) => _SeededSchoolController(
              BuiltList<SchoolForList>([sorbonne, polytechnique]),
            ),
          ),
        ],
      );
      addTearDown(container.dispose);
      return container;
    }

    test('returns every school when the search is empty', () {
      final container = seededContainer();

      expect(
        container.read(schoolFilteredProvider).map((s) => s.id),
        ['a', 'b'],
      );
    });

    test('filters by school name', () {
      final container = seededContainer();
      container.read(schoolSearchProvider.notifier).state = 'sorbonne';

      expect(
        container.read(schoolFilteredProvider).map((s) => s.id),
        ['a'],
      );
    });

    test('filters by school code', () {
      final container = seededContainer();
      container.read(schoolSearchProvider.notifier).state = 'xyz';

      expect(
        container.read(schoolFilteredProvider).map((s) => s.id),
        ['b'],
      );
    });
  });
}
