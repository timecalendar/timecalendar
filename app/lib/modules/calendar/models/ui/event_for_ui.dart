import 'package:timecalendar/modules/calendar/models/deprecated_event.dart';

class EventForUI {
  final DeprecatedEvent? event;

  /// The start column
  int startColumn = 0;

  /// The end column
  int endColumn = 1;

  /// The number of columns of the associated event group
  int columns = 1;

  /// The starting position in the column, between 0 and 1
  double get startX {
    return startColumn / columns;
  }

  /// The arrival position in the column, between 0 and 1
  double get endX {
    return endColumn / columns;
  }

  EventForUI({required this.event});

  /// Create a list of calendar events, with the position of each event in its column.
  ///
  /// * `events` A list of events
  static List<EventForUI> listFromEvents(List<DeprecatedEvent?> events) {
    List<EventForUI> calendarEvents = [];

    for (DeprecatedEvent? event in events) {
      calendarEvents.add(EventForUI(event: event));
    }

    // Sort by start date
    calendarEvents.sort((a, b) {
      return a.event!.start.compareTo(b.event!.start);
    });

    // Check overlap events
    for (int eventIndex = 0; eventIndex < calendarEvents.length; eventIndex++) {
      EventForUI calendarEvent = calendarEvents[eventIndex];
      int startColumn = 0;
      int endColumn = 1;
      int columns = 1;

      // print('---');
      // print(calendarEvent.event.title);

      // Check events before the current event
      List<EventForUI> overlapEvents = [];
      getOverlapEventsBefore(
        calendarEvents,
        eventIndex,
        eventIndex,
        overlapEvents,
      );

      // Get the maximum number of columns
      int maxColumns = 1;
      for (EventForUI overlap in overlapEvents) {
        if (overlap.columns > maxColumns) {
          maxColumns = overlap.columns;
        }
      }

      int oldColumns = maxColumns;

      if (overlapEvents.length > 0) {
        // There are overlap events
        // Check if we can insert the new event in the overlapped events
        int insertPosition = -1;
        int insertColumns = 0;

        int maxInsertPosition = -1;
        int maxInsertColumns = 0;

        // print('Overlaps: ');
        // print(overlapEvents.map((e) => e.event.title));

        for (int columnIndex = 0; columnIndex < oldColumns; columnIndex++) {
          // Get events of the current column
          List<EventForUI> overlapsOfColumn = overlapEvents.where((ev) {
            return ev.startColumn <= columnIndex && ev.endColumn > columnIndex;
          }).toList();
          // print(
          //     '    Column $columnIndex (${overlapsOfColumn.map((e) => e.event.title)}) :');

          // Find the largest column where we can fit the event
          bool eventOverlapInColumn = false;
          for (EventForUI overlapOfColumn in overlapsOfColumn) {
            if (calendarEvent.event!.isOverlap(overlapOfColumn.event!)) {
              eventOverlapInColumn = true;
              // print(
              //     '      > OVERLAP - Overlap by ${overlapOfColumn.event.title}');
              break;
            }
          }

          if (eventOverlapInColumn) {
            // The sequence of columns is broken
            insertPosition = -1;
            insertColumns = 0;
            continue;
          }

          // print('      > OK - There is space !');

          // We can insert in this position
          if (insertPosition == -1) {
            insertPosition = columnIndex;
          }
          insertColumns++;

          if (insertColumns > maxInsertColumns) {
            // We found a larger sequence of column, save it
            maxInsertPosition = insertPosition;
            maxInsertColumns = insertColumns;
          }
        }

        if (maxInsertPosition != -1) {
          // Insert in an existing column
          // print('Insert in existing column, $maxInsertColumns');
          startColumn = maxInsertPosition;
          endColumn = maxInsertPosition + maxInsertColumns;
          columns = oldColumns;

          // print('  > EXISTING - There is space in existing column');
        } else {
          // Add a new column
          // Resize these events
          int newColumns = oldColumns + 1;

          // Set the new size
          for (EventForUI overlap in overlapEvents) {
            overlap.columns = newColumns;
          }

          startColumn = oldColumns;
          endColumn = newColumns;
          columns = newColumns;

          // print('  > NEW_COL - Add a new column');
        }
      } else {
        // print('  > OK - There is space');
      }

      // print('  > Placed at $startColumn - $endColumn (columns: $columns)');

      // Set the new event column position
      calendarEvent.startColumn = startColumn;
      calendarEvent.endColumn = endColumn;
      calendarEvent.columns = columns;
    }

    return calendarEvents;
  }

  static getOverlapEventsBefore(
      List<EventForUI> calendarEvents,
      int eventsBeforeIndex,
      int searchBeforeIndex,
      List<EventForUI> overlapEvents) {
    EventForUI calendarEvent = calendarEvents[eventsBeforeIndex];

    for (int i = 0; i < searchBeforeIndex; i++) {
      EventForUI overlap = calendarEvents[i];

      // Do not add current event
      if (overlap == calendarEvent) continue;

      if (calendarEvent.event!.isOverlap(overlap.event!)) {
        // Check if the event is already added
        if (!overlapEvents.contains(overlap)) {
          // Event overlap
          overlapEvents.add(overlap);

          // Add also overlap events of this event
          getOverlapEventsBefore(
            calendarEvents,
            i,
            searchBeforeIndex,
            overlapEvents,
          );
        }
      }
    }
  }
}
