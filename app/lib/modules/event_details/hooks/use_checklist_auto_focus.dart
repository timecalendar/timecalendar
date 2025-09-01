import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:timecalendar/modules/event_details/controllers/checklist_focus_controller.dart';
import 'package:timecalendar/modules/event_details/models/checklist_item.dart';

useChecklistAutoFocus(
  ChecklistFocusController controller,
  List<ChecklistItem> items,
) {
  final nbItems = useState(-1);

  useEffect(() {
    if (nbItems.value != -1 &&
        items.length > 0 &&
        items.length > nbItems.value) {
      Future.delayed(Duration(milliseconds: 50)).then((_) {
        controller.focusItem(items[items.length - 1]);
      });
    }

    if (items.length > 0) nbItems.value = items.length;

    return null;
  }, [items]);
}
