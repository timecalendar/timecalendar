import 'package:flutter/material.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:timecalendar/modules/personal_event/widgets/app_alert_dialog.dart';

/// Shows the event colour picker and resolves to the chosen colour, or `null`
/// when the user cancels.
///
/// The picker is seeded with [initialColor], so confirming without moving it
/// returns that colour rather than a null value.
Future<Color?> showEventColorPickerDialog(
  BuildContext context,
  Color initialColor,
) {
  return showDialog<Color>(
    context: context,
    builder: (_) => _EventColorPickerDialog(initialColor: initialColor),
  );
}

class _EventColorPickerDialog extends HookWidget {
  const _EventColorPickerDialog({required this.initialColor});

  final Color initialColor;

  @override
  Widget build(BuildContext context) {
    final selected = useState(initialColor);

    return AppAlertDialog(
      title: 'Choisir une couleur',
      content: SizedBox(
        height: 220,
        child: MaterialPicker(
          pickerColor: selected.value,
          onColorChanged: (color) => selected.value = color,
          enableLabel: false,
        ),
      ),
      actions: [
        AppAlertDialogAction(
          text: 'Annuler',
          onPressed: () => Navigator.of(context).pop(),
        ),
        AppAlertDialogAction(
          text: 'Choisir',
          onPressed: () => Navigator.of(context).pop(selected.value),
        ),
      ],
    );
  }
}
