import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/personal_event/controllers/add_personal_event_controller.dart';
import 'package:timecalendar/modules/personal_event/models/personal_event.dart';
import 'package:timecalendar/modules/personal_event/providers/personal_events_provider.dart';
import 'package:timecalendar/modules/personal_event/states/add_personal_event_form_state.dart';
import 'package:timecalendar/modules/personal_event/widgets/event_color_picker_dialog.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';
import 'package:timecalendar/modules/shared/widgets/ui/custom_button.dart';
import 'package:timecalendar/modules/shared/widgets/ui/custom_divider.dart';

/// The add/edit personal-event form.
///
/// All form state and logic live in [addPersonalEventControllerProvider];
/// this widget and its private children are presentation only.
class AddPersonalEventForm extends HookConsumerWidget {
  const AddPersonalEventForm({super.key, this.event});

  /// The event being edited, or `null` when creating a new one.
  final PersonalEvent? event;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final formKey = useMemoized(() => GlobalKey<FormState>());
    final provider = addPersonalEventControllerProvider(event);
    final state = ref.watch(provider);
    final controller = ref.read(provider.notifier);

    void unfocus() => FocusScope.of(context).unfocus();

    Future<void> pickDate() async {
      unfocus();
      final picked = await showDatePicker(
        context: context,
        initialDate: state.date,
        firstDate: DateTime(1970),
        lastDate: DateTime(2100),
      );
      if (picked != null) controller.setDate(picked);
    }

    Future<void> pickTimeStart() async {
      unfocus();
      final picked = await showTimePicker(
        context: context,
        initialTime: state.timeStart,
      );
      if (picked != null) controller.setTimeStart(picked);
    }

    Future<void> pickTimeEnd() async {
      unfocus();
      final picked = await showTimePicker(
        context: context,
        initialTime: state.timeEnd,
      );
      if (picked != null) controller.setTimeEnd(picked);
    }

    Future<void> pickColor() async {
      unfocus();
      final picked = await showEventColorPickerDialog(context, state.color);
      if (picked != null) controller.setColor(picked);
    }

    Future<void> save() async {
      unfocus();
      final form = formKey.currentState!;
      if (!form.validate() || !ref.read(provider).isEndAfterStart) return;
      form.save();
      final saved = controller.buildEvent(
        (color) =>
            ref.read(settingsProvider).getEventColorToSave(color) ?? color,
      );
      await ref.read(personalEventsProvider.notifier).addPersonalEvent(saved);
      if (!context.mounted) return;
      Navigator.of(context).pop(saved);
    }

    return Form(
      key: formKey,
      child: Column(
        children: [
          _FormHeader(
            onClose: () {
              unfocus();
              Navigator.of(context).pop();
            },
            onSave: save,
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView(
              shrinkWrap: true,
              children: [
                _TitleField(
                  initialValue: state.title,
                  onSaved: controller.setTitle,
                ),
                const Divider(),
                _DateField(date: state.date, onTap: pickDate),
                const Divider(),
                _TimeRangeField(
                  state: state,
                  onPickStart: pickTimeStart,
                  onPickEnd: pickTimeEnd,
                ),
                const Divider(),
                const SizedBox(height: 8),
                _IconedTextField(
                  icon: Icons.location_on,
                  hintText: 'Lieu',
                  initialValue: state.location,
                  onSaved: controller.setLocation,
                ),
                CustomDivider(),
                _IconedTextField(
                  icon: Icons.chat,
                  hintText: 'Description',
                  initialValue: state.description,
                  onSaved: controller.setDescription,
                  multiline: true,
                ),
                const SizedBox(height: 8),
                const Divider(),
                _ColorField(color: state.color, onTap: pickColor),
                const Divider(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Close button + "Enregistrer" action row.
class _FormHeader extends StatelessWidget {
  const _FormHeader({required this.onClose, required this.onSave});

  final VoidCallback onClose;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(icon: const Icon(Icons.close), onPressed: onClose),
          CustomButton(onPressed: onSave, text: 'Enregistrer'),
        ],
      ),
    );
  }
}

/// Free-text event title. Stores into the controller on form save.
class _TitleField extends StatelessWidget {
  const _TitleField({required this.initialValue, required this.onSaved});

  final String initialValue;
  final ValueChanged<String> onSaved;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: TextFormField(
        decoration: const InputDecoration.collapsed(
          hintText: 'Saisir un titre',
        ),
        style: const TextStyle(fontSize: 24),
        initialValue: initialValue,
        validator: (value) =>
            (value == null || value.isEmpty) ? 'Entrer un titre' : null,
        onSaved: (value) => onSaved(value ?? ''),
      ),
    );
  }
}

/// A full-width [TextButton] laid out as: leading widget, gap, label.
class _IconRowButton extends StatelessWidget {
  const _IconRowButton({
    required this.leading,
    required this.gap,
    required this.label,
    required this.onTap,
  });

  final Widget leading;
  final double gap;
  final Widget label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: TextButton(
            onPressed: onTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(
                vertical: 8.0,
                horizontal: 10,
              ),
              child: Row(
                children: [
                  leading,
                  SizedBox(width: gap),
                  label,
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Date picker button showing the selected day.
class _DateField extends StatelessWidget {
  const _DateField({required this.date, required this.onTap});

  final DateTime date;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return _IconRowButton(
      leading: const Icon(Icons.calendar_today),
      gap: 15,
      onTap: onTap,
      label: Text(
        AppDateUtils.eventFormDayText(date),
        style: Theme.of(
          context,
        ).textTheme.titleSmall!.copyWith(fontWeight: FontWeight.normal),
      ),
    );
  }
}

/// Start/end time pickers. The end time turns red when it is not strictly
/// after the start time.
class _TimeRangeField extends StatelessWidget {
  const _TimeRangeField({
    required this.state,
    required this.onPickStart,
    required this.onPickEnd,
  });

  final AddPersonalEventFormState state;
  final VoidCallback onPickStart;
  final VoidCallback onPickEnd;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Padding(
          padding: EdgeInsets.only(top: 16.0, bottom: 16.0, left: 20, right: 5),
          child: Icon(Icons.access_alarm),
        ),
        Expanded(
          child: _TimeButton(
            label: 'Début',
            time: state.timeStart,
            isValid: true,
            onPressed: onPickStart,
          ),
        ),
        const VerticalDivider(color: Colors.black),
        Expanded(
          child: _TimeButton(
            label: 'Fin',
            time: state.timeEnd,
            isValid: state.isEndAfterStart,
            onPressed: onPickEnd,
          ),
        ),
      ],
    );
  }
}

/// A single labelled time picker button.
class _TimeButton extends StatelessWidget {
  const _TimeButton({
    required this.label,
    required this.time,
    required this.isValid,
    required this.onPressed,
  });

  final String label;
  final TimeOfDay time;
  final bool isValid;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final labelStyle = theme.textTheme.bodyLarge!;
    final valueStyle = theme.textTheme.bodyMedium!;

    return TextButton(
      onPressed: onPressed,
      child: Align(
        alignment: Alignment.centerLeft,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 5),
              child: Text(
                label,
                textAlign: TextAlign.left,
                style: isValid
                    ? labelStyle
                    : labelStyle.copyWith(color: Colors.red),
              ),
            ),
            Text(
              time.format(context),
              textAlign: TextAlign.start,
              style: isValid
                  ? valueStyle
                  : valueStyle.copyWith(color: Colors.red),
            ),
          ],
        ),
      ),
    );
  }
}

/// A leading [Icon] next to a collapsed [TextFormField]. Stores into the
/// controller on form save.
class _IconedTextField extends StatelessWidget {
  const _IconedTextField({
    required this.icon,
    required this.hintText,
    required this.initialValue,
    required this.onSaved,
    this.multiline = false,
  });

  final IconData icon;
  final String hintText;
  final String initialValue;
  final ValueChanged<String> onSaved;
  final bool multiline;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        Icon(icon),
        SizedBox(
          width: MediaQuery.of(context).size.width * 0.8,
          child: TextFormField(
            maxLines: multiline ? null : 1,
            keyboardType: multiline ? TextInputType.multiline : null,
            decoration: InputDecoration.collapsed(hintText: hintText),
            initialValue: initialValue,
            onSaved: (value) => onSaved(value ?? ''),
          ),
        ),
      ],
    );
  }
}

/// Colour picker button showing the current event colour.
class _ColorField extends StatelessWidget {
  const _ColorField({required this.color, required this.onTap});

  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return _IconRowButton(
      leading: CircleAvatar(backgroundColor: color, radius: 12.0),
      gap: 20,
      onTap: onTap,
      label: Text(
        "Couleur de l'événement",
        style: Theme.of(context).textTheme.titleMedium,
      ),
    );
  }
}
