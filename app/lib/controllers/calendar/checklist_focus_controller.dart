import 'package:timecalendar/models/checklist_item.dart';

class ChecklistFocusController {
  List<Function> _registeredListeners = [];

  ChecklistFocusController(List<Function> listeners) {
    listeners.forEach((listener) => addListener(listener));
  }

  void focusItem(ChecklistItem item) {
    _registeredListeners.forEach((listener) => listener(item));
  }

  void addListener(Function listener) {
    _registeredListeners.add(listener);
  }

  void removeListener(Function listener) {
    _registeredListeners.remove(listener);
  }
}
