import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/activity/models/calendar_log.dart';
import 'package:timecalendar/modules/activity/providers/activity_provider.dart';
import 'package:timecalendar/modules/activity/repositories/calendar_log_repository.dart';
import 'package:timecalendar/modules/activity/widgets/difference_item.dart';
import 'package:timecalendar/modules/activity/widgets/no_activity.dart';
import 'package:timecalendar/modules/shared/utils/snackbar.dart';

class ActivityScreen extends HookConsumerWidget {
  static const routeName = '/activity';

  // Feature switch - set to false to disable activity feature in production
  static const bool _isActivityFeatureEnabled = false;

  const ActivityScreen({Key? key}) : super(key: key);

  Widget _buildCalendarLogsList(List<CalendarLog> calendarLogs) {
    return ListView.builder(
      itemCount: calendarLogs.length,
      itemBuilder: (context, index) {
        return CalendarLogItem(calendarLog: calendarLogs[index]);
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Check feature switch first
    if (!_isActivityFeatureEnabled) {
      return Scaffold(
        appBar: AppBar(title: const Text('Activité')),
        body: NoActivity(appBar: AppBar(title: const Text('Activité'))),
      );
    }

    final calendarLogsAsync = ref.watch(calendarLogsProvider);
    final refreshIndicatorKey = useMemoized(
      () => GlobalKey<RefreshIndicatorState>(),
    );

    // Load calendar logs on first build
    useEffect(() {
      Future.microtask(() {
        ref.read(calendarLogsProvider.notifier).loadCalendarLogs();
      });
      return null;
    }, []);

    Future<void> refreshActivity() async {
      try {
        await ref.read(calendarLogsProvider.notifier).refresh();
      } catch (error) {
        if (context.mounted) {
          showSnackBar(
            context,
            const SnackBar(content: Text('Erreur lors du rafraîchissement')),
          );
        }
      }
    }

    Widget buildContent() {
      return calendarLogsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) {
          // Try to show cached data if available
          return FutureBuilder<List<CalendarLog>>(
            future: ref
                .read(calendarLogRepositoryProvider)
                .getCalendarLogsFromCache(),
            builder: (context, snapshot) {
              if (snapshot.hasData && snapshot.data!.isNotEmpty) {
                return _buildCalendarLogsList(snapshot.data!);
              }
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      size: 64,
                      color: Colors.grey,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Erreur de connexion',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Impossible de charger l\'activité',
                      style: TextStyle(color: Colors.grey),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: refreshActivity,
                      child: const Text('Réessayer'),
                    ),
                  ],
                ),
              );
            },
          );
        },
        data: (calendarLogs) {
          if (calendarLogs.isEmpty) {
            return NoActivity(appBar: AppBar(title: const Text('Activité')));
          }
          return _buildCalendarLogsList(calendarLogs);
        },
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Activité')),
      body: RefreshIndicator(
        key: refreshIndicatorKey,
        onRefresh: refreshActivity,
        child: buildContent(),
      ),
    );
  }
}
