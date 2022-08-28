import 'package:flutter/material.dart';

showSnackBar(BuildContext context, SnackBar snackbar) {
  ScaffoldMessenger.of(context).showSnackBar(snackbar);
}

hideSnackBar(BuildContext context) {
  ScaffoldMessenger.of(context).hideCurrentSnackBar();
}
