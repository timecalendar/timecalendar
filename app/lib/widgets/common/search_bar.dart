import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/providers/settings_provider.dart';

class SearchBar extends StatelessWidget {
  const SearchBar({
    Key? key,
    this.onChanged,
    this.placeholder,
    this.onTap,
    required TextEditingController searchFieldController,
  })  : _searchFieldController = searchFieldController,
        super(key: key);

  final Function? onChanged;
  final Function? onTap;
  final String? placeholder;
  final TextEditingController _searchFieldController;

  @override
  Widget build(BuildContext context) {
    final settingsProvider = Provider.of<SettingsProvider>(context);

    return Container(
      decoration: BoxDecoration(
        boxShadow: [
          BoxShadow(
            offset: Offset(0, 3),
            color: Color.fromRGBO(0, 0, 0, 0.25),
            blurRadius: 10,
          ),
        ],
      ),
      child: Material(
        color: settingsProvider.currentTheme!.cardColor,
        borderRadius: BorderRadius.circular(15),
        child: Padding(
          padding: const EdgeInsets.only(
            top: 8,
            bottom: 8,
            left: 20,
            right: 15,
          ),
          child: TextField(
            onChanged: onChanged as void Function(String)?,
            controller: _searchFieldController,
            decoration: InputDecoration(
              icon: Icon(FontAwesomeIcons.search),
              hintText: placeholder,
            ),
            onTap: () {
              if (onTap != null) onTap!();
            },
          ),
        ),
      ),
    );
  }
}
