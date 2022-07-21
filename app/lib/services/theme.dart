import 'package:flutter/material.dart';

class AppTheme {
  static AppTheme _lightTheme = AppTheme(
    darkMode: false,
    backgroundColor: const Color(0xfffafafa),
    cardColor: const Color(0xffffffff),
    lineColor: const Color(0xffeeeeee),
  );
  static AppTheme _darkTheme = AppTheme(
    darkMode: true,
    backgroundColor: const Color(0xff303030),
    cardColor: const Color(0xff3f3f3f),
    lineColor: const Color(0xff3a3a3a),
  );

  static AppTheme get lightTheme => _lightTheme;
  static AppTheme get darkTheme => _darkTheme;

  late ThemeData theme;
  final Color backgroundColor;
  final Color cardColor;
  final Color lineColor;
  final Color primaryColor = Colors.pink;
  final Color primaryColorLight = Colors.pink.shade100;
  final Color primaryColorDark = Colors.pink.shade700;
  final Color accentColor = Colors.pinkAccent;

  AppTheme({
    required bool darkMode,
    required this.backgroundColor,
    required this.cardColor,
    required this.lineColor,
  }) {
    this.theme = ThemeData(
      buttonTheme: ButtonThemeData(
        minWidth: 10,
        padding: EdgeInsets.symmetric(vertical: 10, horizontal: 10),
        buttonColor: cardColor,
      ),
      brightness: darkMode ? Brightness.dark : Brightness.light,
      primaryColor: primaryColor,
      primaryColorLight: primaryColorLight,
      primaryColorDark: primaryColorDark,
      scaffoldBackgroundColor: backgroundColor,
      toggleableActiveColor: accentColor,
      fontFamily: 'Poppins',
      textTheme: TextTheme(
        headline6: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w500,
        ),
        button: TextStyle(
          fontSize: 12,
        ),
      ),
      appBarTheme: AppBarTheme(backgroundColor: primaryColor),
    );

    this.theme = this.theme.copyWith(
          snackBarTheme: SnackBarThemeData(
            backgroundColor: cardColor,
            contentTextStyle: theme.textTheme.bodyText2,
          ),
          colorScheme: this
              .theme
              .colorScheme
              .copyWith(primary: primaryColor, secondary: accentColor),
        );
  }
}
