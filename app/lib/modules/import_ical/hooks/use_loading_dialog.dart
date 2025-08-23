import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

class LoadingDialogState {
  LoadingDialogState({required this.openDialog, required this.closeDialog});

  final void Function() openDialog;
  final void Function() closeDialog;
}

LoadingDialogState useLoadingDialog(BuildContext context) {
  final dialogContext = useState<BuildContext?>(null);

  openDialog() {
    Future.microtask(() {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) {
          dialogContext.value = context;
          return PopScope(
            child: Dialog(
              child: Padding(
                padding: const EdgeInsets.all(30.0),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(),
                    Padding(
                      padding: const EdgeInsets.only(left: 15.0),
                      child: Text("Importation en cours..."),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      );
    });
  }

  closeDialog() {
    final value = dialogContext.value;

    if (value != null) {
      Navigator.of(value).pop();
      dialogContext.value = null;
    }
  }

  return LoadingDialogState(openDialog: openDialog, closeDialog: closeDialog);
}
