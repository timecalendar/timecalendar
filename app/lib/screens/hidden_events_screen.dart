import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/models/event.dart';
import 'package:timecalendar/providers/events_provider.dart';
import 'package:timecalendar/widgets/hidden_event/hidden_event_item.dart';

class HiddenEventsScreen extends StatefulWidget {
  HiddenEventsScreen({Key? key}) : super(key: key);
  static const routeName = '/hidden_events';

  @override
  _HiddenEventsScreenState createState() => _HiddenEventsScreenState();
}

class _HiddenEventsScreenState extends State<HiddenEventsScreen> {
  List<Event> hiddenUidEvent = [];
  List<String> hiddenNamedEvent = [];

  @override
  void initState() {
    super.initState();
    var eventProvider = Provider.of<EventsProvider>(context, listen: false);
    Future.delayed(Duration.zero, () {
      setState(() {
        this.hiddenUidEvent = List<Event>.from(eventProvider.eventsUidHidden);
        this.hiddenNamedEvent =
            List<String>.from(eventProvider.hiddenEvent.namedHiddenEvents);
      });
    });
  }

  void removeHiddenUidEvent(BuildContext context, int index) async {
    var eventProvider = Provider.of<EventsProvider>(context, listen: false);
    eventProvider.removeUidEvent(hiddenUidEvent[index].uid);
    setState(() {
      this.hiddenUidEvent = List<Event>.from(hiddenUidEvent)..removeAt(index);
    });
  }

  void removeHiddenNamedEvent(BuildContext context, int index) {
    var eventProvider = Provider.of<EventsProvider>(context, listen: false);
    eventProvider.removeNamedEvent(hiddenNamedEvent[index]);

    setState(() {
      this.hiddenNamedEvent = List<String>.from(hiddenNamedEvent)
        ..removeAt(index);
    });
  }

  final GlobalKey<ScaffoldState> _scaffoldKey = new GlobalKey<ScaffoldState>();

  Widget _itemBuilder(BuildContext context, int index) {
    return (index < hiddenNamedEvent.length)
        ? HiddenEventItem(
            namedEvent: hiddenNamedEvent[index],
            index: index,
            removeItem: () => this.removeHiddenNamedEvent(context, index),
          )
        : HiddenEventItem(
            event: hiddenUidEvent[index - hiddenNamedEvent.length],
            index: index,
            removeItem: () => this
                .removeHiddenUidEvent(context, index - hiddenNamedEvent.length),
          );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        title: Text('Événements masqués'),
      ),
      body: (hiddenUidEvent.length + hiddenNamedEvent.length > 0)
          ? ListView.builder(
              itemBuilder: _itemBuilder,
              itemCount: hiddenUidEvent.length + hiddenNamedEvent.length,
            )
          : Center(
              child: Text('Aucun événement masqué'),
            ),
    );
  }
}
