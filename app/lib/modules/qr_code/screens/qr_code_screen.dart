import 'dart:io';

import 'package:flutter/material.dart';
import 'package:timecalendar/modules/qr_code/models/qr_code_result.dart';

class QrCodeScreen extends StatefulWidget {
  static const routeName = '/qr-code';

  @override
  _QrCodeScreenState createState() => _QrCodeScreenState();
}

class _QrCodeScreenState extends State<QrCodeScreen> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  QRViewController? controller;

  // In order to get hot reload to work we need to pause the camera if the platform
  // is android, or resume the camera if the platform is iOS.
  @override
  void reassemble() {
    super.reassemble();
    if (Platform.isAndroid) {
      controller!.pauseCamera();
    } else if (Platform.isIOS) {
      controller!.resumeCamera();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: <Widget>[
          Expanded(
            child: QRView(
              key: qrKey,
              onQRViewCreated: _onQRViewCreated,
              overlay: QrScannerOverlayShape(),
            ),
          ),
        ],
      ),
    );
  }

  void _onQRViewCreated(QRViewController controller) {
    this.controller = controller;
    controller.scannedDataStream.listen((scanData) {
      this._onQRCodeRead(scanData);
    });
  }

  void _onQRCodeRead(Barcode scanData) async {
    this.controller?.pauseCamera();
    Navigator.of(context).pop(QrCodeResult(url: scanData.code));
  }

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }
}
