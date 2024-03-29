import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:timecalendar/modules/changelog/models/changelog.dart';
import 'package:timecalendar/modules/changelog/models/changelog_item.dart';

class Constants {
  static const changelogs = {
    1: Changelog(version: "2.0.2", changelogItems: [
      const ChangelogItem(
        title: "Mode sombre",
        subtitle:
            "Le mode sombre est disponible ! Vous pouvez l'activer dans les paramètres.",
        icon: Icon(
          Icons.brightness_3,
        ),
      ),
      const ChangelogItem(
        title: "Annotez vos cours",
        subtitle:
            "Notez vos devoirs, projets et autres notes dans une checklist.",
        icon: Icon(
          FontAwesomeIcons.squareCheck,
        ),
      ),
      const ChangelogItem(
        title: "Masquer des événements",
        subtitle: "Masquez les cours où vous n'êtes pas inscrit.",
        icon: Icon(
          FontAwesomeIcons.eyeSlash,
        ),
      )
    ]),
    2: Changelog(version: "2.1.0", changelogItems: [
      const ChangelogItem(
        title: "Événements personnalisés",
        subtitle:
            "Ajoutez vos événements, cours et rendez-vous directement dans l'application.",
        icon: Icon(
          Icons.calendar_today,
        ),
      ),
    ]),
  };
  static const currentVersion = 2;
}
