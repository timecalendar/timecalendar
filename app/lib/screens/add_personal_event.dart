import 'package:flutter/material.dart';
import 'package:flutter_material_color_picker/flutter_material_color_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/models/event.dart';
import 'package:timecalendar/providers/events_provider.dart';
import 'package:timecalendar/providers/settings_provider.dart';
import 'package:timecalendar/widgets/common/custom_button.dart';
import 'package:timecalendar/widgets/common/custom_divider.dart';
import 'package:timecalendar/widgets/dialog/app_alert_dialog.dart';
import 'package:uuid/uuid.dart';

class AddPersonalEventScreen extends StatefulWidget {
  static const routeName = '/add-personal-event';
  final Event event;

  const AddPersonalEventScreen({Key key, this.event}) : super(key: key);

  @override
  _AddPersonalEventScreenState createState() => _AddPersonalEventScreenState();
}

// TODO: refactoring code
class _AddPersonalEventScreenState extends State<AddPersonalEventScreen> {
  final _formKey = GlobalKey<FormState>();

  DateTime _date;
  TimeOfDay _timeStart;
  TimeOfDay _timeEnd;

  String _title;
  String _place;
  String _description;
  Color _selectedColor;
  Color _tempShadeColor;
  bool _colorChanged = false;

  @override
  void initState() {
    super.initState();

    var settingsProvider =
        Provider.of<SettingsProvider>(context, listen: false);

    if (widget.event != null) {
      setState(() {
        _title = widget.event.title;
        _place = widget.event.location;
        _description = widget.event.description;
        _selectedColor =
            settingsProvider.getEventColorToDisplay(widget.event.color);
        _date = widget.event.start;
        _timeStart = new TimeOfDay(
            hour: widget.event.start.hour, minute: widget.event.start.minute);
        _timeEnd = new TimeOfDay(
            hour: widget.event.end.hour, minute: widget.event.end.minute);
      });
    } else {
      setState(() {
        _title = "";
        _place = "";
        _description = "";
        _selectedColor = Colors.pink;
        _date = new DateTime.now();
        _timeStart = new TimeOfDay.now();
        _timeEnd = new TimeOfDay(hour: TimeOfDay.now().hour + 1, minute: 0);
      });
    }
  }

  /// Unfocus text to prevent the keyboard from reopening
  void unfocusText(BuildContext context) {
    FocusScope.of(context).unfocus();
  }

  Future<Null> selectDate(BuildContext context) async {
    unfocusText(context);

    final DateTime picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(1970),
      lastDate: DateTime(2100),
    );

    if (picked != null && picked != _date) {
      setState(() {
        _date = picked;
      });
    }
  }

  Future<Null> selectTimeStart(BuildContext context) async {
    unfocusText(context);

    final TimeOfDay picked = await showTimePicker(
      context: context,
      initialTime: _timeStart,
    );

    if (picked != null && picked != _timeStart) {
      setState(() {
        _timeStart = picked;
      });
    }
  }

  Future<Null> selectTimeEnd(BuildContext context) async {
    unfocusText(context);

    final TimeOfDay picked = await showTimePicker(
      context: context,
      initialTime: _timeEnd,
    );

    if (picked != null && picked != _timeEnd) {
      setState(() {
        _timeEnd = picked;
      });
    }
  }

  void saveEvent(BuildContext context) async {
    unfocusText(context);

    var settingsProvider =
        Provider.of<SettingsProvider>(context, listen: false);
    var eventsProvider = Provider.of<EventsProvider>(context, listen: false);

    // Set the new color if the user has picked a color
    final newColor = (_colorChanged || widget.event == null)
        ? settingsProvider.getEventColorToSave(_selectedColor)
        : widget.event.color;

    Event event;
    if (widget.event != null) {
      event = new Event(
        uid: widget.event.uid,
        color: newColor,
        description: _description,
        title: _title,
        teachers: [],
        tags: [],
        shortDescription: _description,
        exportedAt: widget.event.exportedAt,
        unitId: -1,
        location: _place,
        groupColor: widget.event.groupColor,
        start: DateTime(
          _date.year,
          _date.month,
          _date.day,
          _timeStart.hour,
          _timeStart.minute,
        ),
        end: DateTime(
          _date.year,
          _date.month,
          _date.day,
          _timeEnd.hour,
          _timeEnd.minute,
        ),
      );

      await eventsProvider.updatePersonalEvent(event);
      Navigator.of(context).pop(event);
    } else {
      event = new Event(
        uid: Uuid().v4(),
        color: settingsProvider.getEventColorToSave(_selectedColor),
        description: _description,
        title: _title,
        teachers: [],
        tags: [],
        shortDescription: _description,
        exportedAt: DateTime.now(),
        unitId: -1,
        location: _place,
        groupColor: Colors.blue,
        start: DateTime(
          _date.year,
          _date.month,
          _date.day,
          _timeStart.hour,
          _timeStart.minute,
        ),
        end: DateTime(
          _date.year,
          _date.month,
          _date.day,
          _timeEnd.hour,
          _timeEnd.minute,
        ),
      );

      await eventsProvider.addPersonalEvent(event);
    }

    Navigator.of(context).pop();
  }

  void onColorChoose(bool validateColor) {
    Navigator.of(context).pop();
    if (validateColor) {
      setState(() {
        _selectedColor = _tempShadeColor;
        _colorChanged = true;
      });
    }
  }

  void _openColorPicker() async {
    unfocusText(context);

    showDialog(
      context: context,
      builder: (_) => AppAlertDialog(
        title: "Choisir une couleur",
        content: Container(
          height: 220,
          child: MaterialColorPicker(
            selectedColor: _selectedColor,
            onColorChange: (color) => setState(() => _tempShadeColor = color),
          ),
        ),
        actions: [
          AppAlertDialogAction(
              text: 'Annuler', onPressed: () => onColorChoose(false)),
          AppAlertDialogAction(
              text: 'Choisir', onPressed: () => onColorChoose(true)),
        ],
      ),
    );
  }

  bool endTimeSuperior() {
    return (_timeStart.hour < _timeEnd.hour) ||
        (_timeStart.hour == _timeEnd.hour &&
            _timeStart.minute < _timeEnd.minute);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: Column(
            children: <Widget>[
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: <Widget>[
                    IconButton(
                      icon: Icon(Icons.close),
                      onPressed: () {
                        unfocusText(context);
                        Navigator.of(context).pop();
                      },
                    ),
                    CustomButton(
                      onPressed: () {
                        if (_formKey.currentState.validate() &&
                            (_timeStart.hour + _timeStart.minute / 60) <
                                (_timeEnd.hour + _timeEnd.minute / 60)) {
                          saveEvent(context);
                        }
                      },
                      text: 'Enregistrer',
                    )
                  ],
                ),
              ),
              SizedBox(
                height: 16,
              ),
              Expanded(
                child: ListView(
                  shrinkWrap: true,
                  children: <Widget>[
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: TextFormField(
                        decoration: const InputDecoration.collapsed(
                          hintText: 'Saisir un titre',
                        ),
                        style: TextStyle(
                          fontSize: 24,
                        ),
                        initialValue: _title,
                        validator: (value) {
                          if (value.isEmpty) {
                            return 'Entrer un titre';
                          }
                          _title = value;
                          return null;
                        },
                      ),
                    ),
                    Divider(),
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: TextButton(
                            child: Padding(
                              padding: EdgeInsets.symmetric(
                                vertical: 8.0,
                                horizontal: 10,
                              ),
                              child: Row(
                                children: <Widget>[
                                  Icon(Icons.calendar_today),
                                  SizedBox(
                                    width: 15,
                                  ),
                                  Text(
                                    new DateFormat("EEEE dd MMMM", "fr")
                                        .format(_date),
                                    style: Theme.of(context)
                                        .textTheme
                                        .subtitle2
                                        .copyWith(
                                          fontWeight: FontWeight.normal,
                                        ),
                                  ),
                                ],
                              ),
                            ),
                            onPressed: () => selectDate(context),
                          ),
                        )
                      ],
                    ),
                    Divider(),
                    Row(
                      children: <Widget>[
                        Padding(
                          padding: EdgeInsets.only(
                              top: 16.0, bottom: 16.0, left: 20, right: 5),
                          child: Icon(Icons.access_alarm),
                        ),
                        Expanded(
                          child: Row(
                            children: <Widget>[
                              Expanded(
                                child: TextButton(
                                    onPressed: () => selectTimeStart(context),
                                    child: Stack(
                                      children: <Widget>[
                                        Align(
                                          alignment: Alignment.centerLeft,
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: <Widget>[
                                              Padding(
                                                padding: const EdgeInsets.only(
                                                    top: 5),
                                                child: Text(
                                                  'Début',
                                                  textAlign: TextAlign.left,
                                                  style: Theme.of(context)
                                                      .textTheme
                                                      .bodyText1,
                                                ),
                                              ),
                                              Text(
                                                _timeStart.format(context),
                                                textAlign: TextAlign.start,
                                                style: Theme.of(context)
                                                    .textTheme
                                                    .bodyText2,
                                              ),
                                            ],
                                          ),
                                        )
                                      ],
                                    )),
                              )
                            ],
                          ),
                        ),
                        VerticalDivider(
                          color: Colors.black,
                        ),
                        Expanded(
                          child: Row(
                            children: <Widget>[
                              Expanded(
                                child: TextButton(
                                    onPressed: () => selectTimeEnd(context),
                                    child: Stack(
                                      children: <Widget>[
                                        Align(
                                          alignment: Alignment.centerLeft,
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: <Widget>[
                                              Padding(
                                                padding: const EdgeInsets.only(
                                                    top: 5),
                                                child: Text(
                                                  'Fin',
                                                  textAlign: TextAlign.left,
                                                  style: Theme.of(context)
                                                      .textTheme
                                                      .bodyText1
                                                      .copyWith(
                                                          color: endTimeSuperior()
                                                              ? Theme.of(
                                                                      context)
                                                                  .textTheme
                                                                  .bodyText1
                                                                  .color
                                                              : Colors.red),
                                                ),
                                              ),
                                              Text(
                                                _timeEnd.format(context),
                                                textAlign: TextAlign.start,
                                                style: Theme.of(context)
                                                    .textTheme
                                                    .bodyText2
                                                    .copyWith(
                                                        color: endTimeSuperior()
                                                            ? Theme.of(context)
                                                                .textTheme
                                                                .bodyText1
                                                                .color
                                                            : Colors.red),
                                              ),
                                            ],
                                          ),
                                        )
                                      ],
                                    )),
                              )
                            ],
                          ),
                        )
                      ],
                    ),
                    Divider(),
                    SizedBox(
                      height: 8,
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: <Widget>[
                        Icon(Icons.location_on),
                        Container(
                          width: MediaQuery.of(context).size.width * 0.8,
                          child: TextFormField(
                            decoration: const InputDecoration.collapsed(
                              hintText: 'Lieu',
                            ),
                            initialValue: _place,
                            validator: (value) {
                              _place = value;
                              return null;
                            },
                          ),
                        ),
                      ],
                    ),
                    CustomDivider(),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: <Widget>[
                        Icon(Icons.chat),
                        Container(
                          width: MediaQuery.of(context).size.width * 0.8,
                          child: TextFormField(
                            maxLines: null,
                            keyboardType: TextInputType.multiline,
                            decoration: const InputDecoration.collapsed(
                              hintText: 'Description',
                            ),
                            initialValue: _description,
                            validator: (value) {
                              _description = value;
                              return null;
                            },
                          ),
                        ),
                      ],
                    ),
                    SizedBox(
                      height: 8,
                    ),
                    Divider(),
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: TextButton(
                              child: Padding(
                                padding: EdgeInsets.symmetric(
                                  vertical: 8.0,
                                  horizontal: 10,
                                ),
                                child: Row(
                                  children: <Widget>[
                                    CircleAvatar(
                                      backgroundColor: _selectedColor,
                                      radius: 12.0,
                                    ),
                                    SizedBox(
                                      width: 20,
                                    ),
                                    Text(
                                      "Couleur de l'événement",
                                      style:
                                          Theme.of(context).textTheme.subtitle1,
                                    )
                                  ],
                                ),
                              ),
                              onPressed: _openColorPicker),
                        )
                      ],
                    ),
                    Divider(),
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
