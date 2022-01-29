import 'package:flutter/material.dart';
import 'package:timecalendar/database/calendar_manager.dart';
import 'package:timecalendar/database/checklist_item_manager.dart';
import 'package:timecalendar/database/event_manager.dart';
import 'package:timecalendar/database/hidden_event_manager.dart';
import 'package:timecalendar/database/personal_event_manager.dart';
import 'package:timecalendar/models/hidden_event.dart';
import 'package:timecalendar/models/event_by_day.dart';
import 'package:timecalendar/services/notification/notification.dart';
import 'package:timecalendar/utils/date_utils.dart';

import '../models/event.dart';

class EventsProvider with ChangeNotifier {
  static final today = DateTime.now();
  static final tomorrow = DateTime.now().add(Duration(days: 1));
  static final dayAfterTomorrow = DateTime.now().add(Duration(days: 2));

  List<Event> events = [];
  List<Event> eventsUidHidden = [];
  List<Event> eventsNamedHidden = [];
  List<EventByDay> eventsByDay = [];

  HiddenEvent hiddenEvent =
      new HiddenEvent(namedHiddenEvents: [], uidHiddenEvents: []);

  HiddenEventManager hiddenEventManager = new HiddenEventManager();

  EventsProvider() {
    // loadEvents();
  }

  void loadEvents() async {
    try {
      hiddenEvent = await hiddenEventManager.getHiddenEvents();
      await loadEventsFromDatabase();
      await fetchAndSetEvents();
    } on Exception catch (_) {}
  }

  Future<void> loadEventsFromDatabase() async {
    var tmpEvents = await EventManager().getEvents();
    List<Event> personalEvents = await PersonalEventManager().getEvents();
    tmpEvents = [...tmpEvents, ...personalEvents];

    // Sort events
    tmpEvents.sort((a, b) {
      return a.start.compareTo(b.start);
    });

    events = tmpEvents;

    controlEvent();

    notifyListeners();
  }

  void loadEventByDay() {
    eventsByDay = getDayEventsList();
  }

  Future<void> fetchAndSetEvents() async {
    try {
      // Load calendar
      final calendar = await CalendarManager.loadCalendars();
      if (calendar.length == 0) return;
      // TODO: multicalendar
      events = await calendar[0].fetchEventsFromApi();

      // Save events into database
      var eventManager = EventManager();
      await eventManager.setEvents(events);

      // Load events from database
      await loadEventsFromDatabase();

      // Subscribe to the calendar
      var notification = NotificationService();
      await notification.subscribeToCalendar(calendar[0]);

      // Load all checklist items
      await updateEventNotes();

      notifyListeners();
    } on Exception catch (error) {
      throw error;
    }
  }

  updateEventNotes() async {
    var numberOfNotes = await ChecklistItemManager().findEventNumberOfNotes();

    events.forEach((event) {
      if (numberOfNotes.containsKey(event.uid)) {
        event.completedNotes = numberOfNotes[event.uid].completedNotes;
        event.totalNotes = numberOfNotes[event.uid].totalNotes;
      } else {
        event.completedNotes = 0;
        event.totalNotes = 0;
      }
    });

    events = List<Event>.from(events);

    notifyListeners();
  }

  DateTime get homeDay {
    DateTime now = DateTime(today.year, today.month, today.day, 0, 0, 0);

    if (events.length == 0) return null;

    // Get the first event after
    var firstEvent = events.firstWhere((event) {
      return event.start.isAfter(now);
    }, orElse: () {
      return null;
    });

    if (firstEvent == null) return now;
    return DateTime(firstEvent.start.year, firstEvent.start.month,
        firstEvent.start.day, 0, 0, 0);
  }

  List<Event> get homeEvents {
    if (events.length == 0) return [];
    var firstEvent = homeDay;

    if (firstEvent == null) {
      return [];
    }

    // Get events of this day
    var dayEvents = events.where((event) {
      return event.start.year == firstEvent.year &&
          event.start.month == firstEvent.month &&
          event.start.day == firstEvent.day;
    }).toList();

    return dayEvents;
  }

  List<EventByDay> getDayEventsList() {
    var dayEvents = events.toList();
    // TODO: comprendre pourquoi c'est pas trier!
    dayEvents.sort((a, b) {
      return a.start.compareTo(b.start);
    });

    if (events.length == 0) return [];

    List<EventByDay> dayEventsList = [];
    var currentDay = dayEvents[0].end;
    List<Event> currentDayEvents = [];
    dayEvents.forEach((event) {
      if (!AppDateUtils.isSameDate(event.start, currentDay)) {
        dayEventsList.add(EventByDay(currentDay, currentDayEvents));
        currentDayEvents = [];
      }
      currentDay = event.end;
      currentDayEvents.add(event);
    });
    dayEventsList.add(EventByDay(currentDay, currentDayEvents));
    return dayEventsList;
  }

  List<List<Event>> getWeekEvents(int weekNumber) {
    var start = AppDateUtils.dayAtWeekNumber(weekNumber);
    var end = start.add(Duration(days: 7));

    var weekEvents = events
        .where(
            (event) => start.isBefore(event.end) && event.start.isBefore(end))
        .toList();

    List<List<Event>> dayEvents = [];
    for (var day = 0; day < 7; day++) {
      var startOfDay = start.add(Duration(days: day));
      var endOfDay = startOfDay.add(Duration(days: 1));
      var currentDayEvents = [];
      currentDayEvents.addAll(weekEvents
          .where((event) =>
              startOfDay.isBefore(event.end) && event.start.isBefore(endOfDay))
          .toList());
      dayEvents.add(List<Event>.from(currentDayEvents));
    }

    return dayEvents;
  }

  void controlEvent() {
    eventsUidHidden = List<Event>.from(events);
    eventsUidHidden = eventsUidHidden
        .where((item) => hiddenEvent.uidHiddenEvents.contains(item.uid))
        .toList();

    eventsNamedHidden = List<Event>.from(events);
    eventsNamedHidden = eventsNamedHidden
        .where((item) => hiddenEvent.namedHiddenEvents.contains(item.title))
        .toList();

    events = events
        .where((item) =>
            !hiddenEvent.uidHiddenEvents.contains(item.uid) &&
            !hiddenEvent.namedHiddenEvents.contains(item.title))
        .toList();
  }

  Future<void> addUidEvent(String uidEvent) async {
    hiddenEvent.uidHiddenEvents.add(uidEvent);
    await hiddenEventManager.setHiddenEvents(hiddenEvent);
    loadEvents();
  }

  Future<void> addNamedEvent(String namedEvent) async {
    hiddenEvent.namedHiddenEvents.add(namedEvent);
    await hiddenEventManager.setHiddenEvents(hiddenEvent);
    loadEvents();
  }

  Future<void> removeUidEvent(String uidEvent) async {
    hiddenEvent.uidHiddenEvents.remove(uidEvent);
    await hiddenEventManager.setHiddenEvents(hiddenEvent);
    loadEvents();
  }

  Future<void> removeNamedEvent(String namedEvent) async {
    hiddenEvent.namedHiddenEvents.remove(namedEvent);
    await hiddenEventManager.setHiddenEvents(hiddenEvent);
    loadEvents();
  }

  Future<void> addPersonalEvent(Event event) async {
    await PersonalEventManager().putEvent(event);
    loadEvents();
  }

  Future<void> removePersonalEvent(String uuid) async {
    await PersonalEventManager().removeEvent(uuid);
    loadEvents();
  }

  Future<void> updatePersonalEvent(Event event) async {
    await PersonalEventManager().updateEvent(event);
    loadEvents();
  }
}
