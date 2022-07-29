import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/import_ical/hooks/use_import_ical_controller.dart';
import 'package:timecalendar/widgets/import_ical/ask_for_ical_url.dart';
import 'package:timecalendar/widgets/import_ical/scan_qr_code.dart';

class ImportIcalScreenArguments {
  final bool isInternal;

  ImportIcalScreenArguments(this.isInternal);
}

class ImportIcalScreen extends HookConsumerWidget {
  static const routeName = '/import-ical';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = useImportIcalController(context, ref);
    final ImportIcalScreenArguments args =
        ModalRoute.of(context)!.settings.arguments as ImportIcalScreenArguments;
    final isInternal = args.isInternal;

    final mediaQuery = MediaQuery.of(context);
    final availableWidth = mediaQuery.size.width - 200;

    return Scaffold(
      body: Column(
        children: <Widget>[
          Expanded(
            child: CustomScrollView(
              slivers: <Widget>[
                SliverAppBar(
                  pinned: true,
                  flexibleSpace: FlexibleSpaceBar(
                    title: ConstrainedBox(
                      constraints: BoxConstraints(
                        maxWidth: availableWidth,
                      ),
                      child: Text(
                        isInternal
                            ? "Importer depuis le web"
                            : "Importer votre calendrier",
                        style: TextStyle(fontSize: 18),
                      ),
                    ),
                  ),
                  expandedHeight: 200.0,
                ),
                SliverList(
                  delegate: SliverChildListDelegate([
                    Padding(
                      padding: const EdgeInsets.all(15.0),
                      child: Column(
                        children: <Widget>[
                          Text(
                            (isInternal
                                    ? "Pour importer votre calendrier, scannez le QR Code qui s'affiche sur le site internet de TimeCalendar."
                                    : "Pour importer votre calendrier, scannez le QR Code qui s'affiche sur la page de votre université.") +
                                "\n\nVous pouvez aussi coller le lien ICal du calendrier en appuyant sur le bouton ci-dessous.",
                            style: TextStyle(fontSize: 16),
                          ),
                        ],
                      ),
                    ),
                  ]),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(15.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: <Widget>[
                ScanQrCode(onScan: controller.loadIcalUrl),
                SizedBox(height: 10),
                AskForIcalUrl(onSubmit: controller.loadIcalUrl),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
