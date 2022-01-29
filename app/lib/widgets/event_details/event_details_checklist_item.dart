import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/controllers/calendar/checklist_focus_controller.dart';
import 'package:timecalendar/models/checklist_item.dart';
import 'package:timecalendar/providers/checklist_provider.dart';

class EventDetailsChecklistItem extends StatefulWidget {
  final ChecklistItem checklistItem;
  final Function removeItem;
  final Function onContentChanged;
  final Function onCheckChanged;
  final ChecklistFocusController checklistFocusController;

  EventDetailsChecklistItem(
      {Key key,
      @required this.checklistItem,
      @required this.removeItem,
      @required this.onContentChanged,
      @required this.onCheckChanged,
      @required this.checklistFocusController})
      : super(key: key);

  @override
  _EventDetailsChecklistItemState createState() =>
      _EventDetailsChecklistItemState();
}

class _EventDetailsChecklistItemState extends State<EventDetailsChecklistItem> {
  final contentController = TextEditingController();

  FocusNode focusNode;

  @override
  void initState() {
    super.initState();

    focusNode = FocusNode();

    Future.delayed(Duration.zero).then((_) {
      widget.checklistFocusController.addListener(onRequestFocus);
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    contentController.text = widget.checklistItem.content;
  }

  @override
  void dispose() {
    focusNode.dispose();
    widget.checklistFocusController.removeListener(onRequestFocus);

    super.dispose();
  }

  void checkFocus(BuildContext context) {
    final checklistProvider =
        Provider.of<ChecklistProvider>(context, listen: false);

    if (checklistProvider.focusedItem.uuid == widget.checklistItem.uuid) {
      // Focus textfield
      FocusScope.of(context).requestFocus(focusNode);
    }
  }

  void onRequestFocus(ChecklistItem item) {
    if (item.uuid == widget.checklistItem.uuid) {
      // Focus textfield
      FocusScope.of(context).requestFocus(focusNode);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      child: Row(
        children: <Widget>[
          Checkbox(
            value: widget.checklistItem.isChecked,
            onChanged: (val) =>
                widget.onCheckChanged(widget.checklistItem, val),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                TextField(
                  focusNode: focusNode,
                  maxLines: null,
                  key: Key(widget.checklistItem.uuid),
                  controller: contentController,
                  decoration: InputDecoration(
                    border: InputBorder.none,
                    focusedBorder: UnderlineInputBorder(
                      borderSide: BorderSide(
                        color: Theme.of(context).primaryColor,
                        width: 2,
                      ),
                    ),
                  ),
                  onChanged: (val) =>
                      widget.onContentChanged(widget.checklistItem, val),
                ),
              ],
            ),
          ),
          IconButton(
            icon: Icon(Icons.close, size: 16, color: Colors.grey[500]),
            onPressed: () {
              widget.removeItem(widget.checklistItem);
            },
          ),
        ],
      ),
    );
  }
}
