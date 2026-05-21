import 'package:flutter/material.dart';
import 'package:timecalendar/modules/personal_event/models/personal_event.dart';
import 'package:timecalendar/modules/personal_event/widgets/add_personal_event_form.dart';

/// Route-level shell for adding or editing a [PersonalEvent].
///
/// All form state and logic live in [AddPersonalEventForm] and
/// `AddPersonalEventController`; this widget is only the scaffold.
class AddPersonalEventScreen extends StatelessWidget {
  static const routeName = '/add-personal-event';

  /// The event to edit, or `null` to create a new one.
  final PersonalEvent? event;

  const AddPersonalEventScreen({super.key, this.event});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(child: AddPersonalEventForm(event: event)),
    );
  }
}
