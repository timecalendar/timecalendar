import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';
import 'package:timecalendar_api/timecalendar_api.dart';

class SchoolItem extends ConsumerWidget {
  const SchoolItem({
    Key? key,
    required this.school,
    required this.onSchoolSelect,
  }) : super(key: key);

  final SchoolForList school;
  final Function(SchoolForList) onSchoolSelect;

  /// Shown while the logo loads and whenever it fails to load — a school logo
  /// is optional decoration, never a hard dependency of the screen.
  static const _placeholder = AssetImage('assets/images/school.png');

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 15, vertical: 8),
      child: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              offset: Offset(0, 3),
              color: Color.fromRGBO(0, 0, 0, 0.1),
              blurRadius: 8,
            ),
          ],
        ),
        child: Material(
          color: settings.currentTheme.cardColor,
          borderRadius: BorderRadius.circular(15),
          child: InkWell(
            onTap: () => onSchoolSelect(school),
            borderRadius: BorderRadius.circular(15),
            child: Row(
              children: <Widget>[
                Container(
                  height: 100,
                  width: 100,
                  child: ClipRRect(
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(15),
                      topLeft: Radius.circular(15),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(5.0),
                      child: FadeInImage(
                        image: CachedNetworkImageProvider(school.imageUrl),
                        placeholder: _placeholder,
                        // A failed logo load (offline, dead URL, DNS failure)
                        // must degrade to the placeholder, never surface a
                        // reported FlutterError that breaks the screen.
                        imageErrorBuilder: (context, error, stackTrace) =>
                            const Image(image: _placeholder),
                      ),
                    ),
                  ),
                ),
                SizedBox(width: 10),
                Flexible(
                  child: Text(school.name, style: TextStyle(fontSize: 18)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
