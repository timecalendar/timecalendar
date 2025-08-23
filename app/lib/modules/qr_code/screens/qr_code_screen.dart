import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:timecalendar/modules/qr_code/models/qr_code_result.dart';

class QrCodeScreen extends StatefulWidget {
  static const routeName = '/qr-code';

  @override
  _QrCodeScreenState createState() => _QrCodeScreenState();
}

class _QrCodeScreenState extends State<QrCodeScreen>
    with WidgetsBindingObserver {
  final MobileScannerController controller = MobileScannerController(
    autoStart: false,
    formats: [BarcodeFormat.qrCode],
  );

  @override
  void initState() {
    super.initState();
    // Start listening to lifecycle changes
    WidgetsBinding.instance.addObserver(this);
    // Start the scanner
    controller.start();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // If the controller is not ready, do not try to start or stop it
    if (!controller.value.hasCameraPermission) {
      return;
    }

    switch (state) {
      case AppLifecycleState.detached:
      case AppLifecycleState.hidden:
      case AppLifecycleState.paused:
        return;
      case AppLifecycleState.resumed:
        // Restart the scanner when the app is resumed
        controller.start();
      case AppLifecycleState.inactive:
        // Stop the scanner when the app is paused
        controller.stop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: <Widget>[
          Expanded(
            child: MobileScanner(
              controller: controller,
              onDetect: _onQRCodeRead,
            ),
          ),
        ],
      ),
    );
  }

  void _onQRCodeRead(BarcodeCapture barcodeCapture) async {
    final barcode = barcodeCapture.barcodes.first;
    if (barcode.rawValue != null) {
      // Stop the scanner to prevent multiple scans
      await controller.stop();
      Navigator.of(context).pop(QrCodeResult(url: barcode.rawValue));
    }
  }

  @override
  Future<void> dispose() async {
    // Stop listening to lifecycle changes
    WidgetsBinding.instance.removeObserver(this);
    // Dispose the controller
    await controller.dispose();
    super.dispose();
  }
}
