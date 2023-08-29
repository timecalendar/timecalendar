import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/debug/providers/debug_provider.dart';

class CalendarDetails extends HookConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final calendarDetails = ref.watch(debugCalendarDetailsProvider);

    return calendarDetails.when(
        data: (text) => Text(text),
        loading: () => Container(),
        error: (error, stack) => Container());
  }
}
