import 'package:built_collection/built_collection.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:hooks_riverpod/legacy.dart';
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
  _SeededSchoolController(this._schools);

  final BuiltList<SchoolForList> _schools;

  @override
  Future<BuiltList<SchoolForList>> build() async => _schools;
}

void main() {
  group('SchoolSelectionController.build', () {
    test('resolves to AsyncData with the fetched schools', () async {
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

      final container = ProviderContainer(
        overrides: [apiClientProvider.overrideWithValue(client)],
      );
      addTearDown(container.dispose);

      final result = await container.read(
        schoolSelectionControllerProvider.future,
      );

      expect(result.map((s) => s.id), ['a', 'b']);
      expect(
        container.read(schoolSelectionControllerProvider),
        isA<AsyncData<BuiltList<SchoolForList>>>(),
      );
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
            () => _SeededSchoolController(
              BuiltList<SchoolForList>([sorbonne, polytechnique]),
            ),
          ),
        ],
      );
      addTearDown(container.dispose);
      return container;
    }

    test('returns every school when the search is empty', () async {
      final container = seededContainer();
      await container.read(schoolSelectionControllerProvider.future);

      expect(
        container.read(schoolFilteredProvider).map((s) => s.id),
        ['a', 'b'],
      );
    });

    test('filters by school name', () async {
      final container = seededContainer();
      await container.read(schoolSelectionControllerProvider.future);
      container.read(schoolSearchProvider.notifier).state = 'sorbonne';

      expect(
        container.read(schoolFilteredProvider).map((s) => s.id),
        ['a'],
      );
    });

    test('filters by school code', () async {
      final container = seededContainer();
      await container.read(schoolSelectionControllerProvider.future);
      container.read(schoolSearchProvider.notifier).state = 'xyz';

      expect(
        container.read(schoolFilteredProvider).map((s) => s.id),
        ['b'],
      );
    });
  });
}
