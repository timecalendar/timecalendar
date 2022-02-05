import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timecalendar/screens/import_ical_screen.dart';

enum SchoolSelectionOptions { AddSchool, ImportIcal }

class SchoolSelectionHeader extends ConsumerStatefulWidget {
  final Function loadSchoolAssistant;
  final ScrollController scrollController;

  const SchoolSelectionHeader({
    Key? key,
    required this.loadSchoolAssistant,
    required this.scrollController,
  }) : super(key: key);

  @override
  _SchoolSelectionHeaderState createState() => _SchoolSelectionHeaderState();
}

class _SchoolSelectionHeaderState extends ConsumerState<SchoolSelectionHeader> {
  bool _isScrollLimitReached = true;

  @override
  void initState() {
    super.initState();
    widget.scrollController.addListener(() {
      final newState = widget.scrollController.offset <=
          (widget.scrollController.position.minScrollExtent + 120.0);

      if (newState != _isScrollLimitReached) {
        setState(() {
          _isScrollLimitReached = newState;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final availableWidth = mediaQuery.size.width - 160;

    return SliverAppBar(
      pinned: true,
      actions: <Widget>[
        PopupMenuButton(
          icon: Icon(
            Icons.more_vert,
          ),
          onSelected: (SchoolSelectionOptions selectedValue) {
            switch (selectedValue) {
              case SchoolSelectionOptions.AddSchool:
                widget.loadSchoolAssistant();
                break;
              case SchoolSelectionOptions.ImportIcal:
                Navigator.of(context).pushNamed(
                  ImportIcalScreen.routeName,
                  arguments: ImportIcalScreenArguments(true),
                );
                break;
            }
          },
          tooltip: 'Menu',
          itemBuilder: (_) => [
            PopupMenuItem(
              child: Text('Ajouter votre établissement'),
              value: SchoolSelectionOptions.AddSchool,
            ),
            PopupMenuItem(
              child: Text('Scanner un QR code'),
              value: SchoolSelectionOptions.ImportIcal,
            ),
          ],
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        title: ConstrainedBox(
          constraints: BoxConstraints(
            maxWidth: availableWidth,
          ),
          child: Text(
            _isScrollLimitReached
                ? "Sélectionnez votre établissement"
                : "Établissement",
            style: TextStyle(fontSize: 18),
            overflow: _isScrollLimitReached
                ? TextOverflow.visible
                : TextOverflow.ellipsis,
          ),
        ),
      ),
      expandedHeight: 200.0,
    );
  }
}
