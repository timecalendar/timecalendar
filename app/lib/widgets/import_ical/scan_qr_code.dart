// import 'package:barcode_scan/barcode_scan.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:timecalendar/modules/qr_code/models/qr_code_result.dart';
import 'package:timecalendar/modules/qr_code/screens/qr_code_screen.dart';
import 'package:timecalendar/widgets/common/custom_button.dart';

class ScanQrCode extends StatelessWidget {
  final Function onScan;

  const ScanQrCode({Key key, this.onScan}) : super(key: key);

  void _scanQrCodeAndGetUrl(BuildContext context) async {
    var status = await Permission.camera.request();

    print(status);

    if (status.isDenied || status.isPermanentlyDenied) {
      return showDialog(
        context: context,
        builder: (BuildContext context) {
          // return object of type Dialog
          return AlertDialog(
            title: new Text("Permission refusée"),
            content: new Text(
                "Vous devez autoriser l'application à utiliser votre appareil photo pour scanner le QR code."),
            actions: <Widget>[
              new TextButton(
                child: new Text("Paramètres"),
                onPressed: () async {
                  await openAppSettings();
                  Navigator.of(context).pop();
                },
              ),
              new TextButton(
                child: new Text("Fermer"),
                onPressed: () {
                  Navigator.of(context).pop();
                },
              ),
            ],
          );
        },
      );
    }

    QrCodeResult result =
        await Navigator.of(context).pushNamed<dynamic>(QrCodeScreen.routeName);
    if (result?.url != null) {
      this.onScan(result.url);
    }
  }

  @override
  Widget build(BuildContext context) {
    return CustomButton(
      text: 'Scanner le QR Code',
      onPressed: () => _scanQrCodeAndGetUrl(context),
    );
  }
}
