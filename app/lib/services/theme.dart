import 'package:flutter/material.dart';
import 'package:timecalendar/utils/color_utils.dart';

class AppTheme {
  static AppTheme? _lightTheme;
  static AppTheme? _darkTheme;

  static AppTheme? get lightTheme => _lightTheme;
  static AppTheme? get darkTheme => _darkTheme;

  ThemeData? theme;
  final Color? backgroundColor;
  final Color? cardColor;
  final Color? lineColor;
  final Color primaryColor = Colors.pink;
  final Color? primaryColorLight = Colors.pink[100];
  final Color? primaryColorDark = Colors.pink[700];
  final Color accentColor = Colors.pinkAccent;

  AppTheme(
      {required bool darkMode, this.backgroundColor, this.cardColor, this.lineColor}) {
    this.theme = ThemeData(
      buttonTheme: ButtonThemeData(
        minWidth: 10,
        padding: EdgeInsets.symmetric(vertical: 10, horizontal: 10),
        buttonColor: cardColor,
      ),
      // textButtonTheme: TextButtonThemeData(style: ButtonStyle()),
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

    this.theme = this.theme!.copyWith(
          snackBarTheme: SnackBarThemeData(
            backgroundColor: cardColor,
            contentTextStyle: theme!.textTheme.bodyText2,
          ),
          colorScheme: this
              .theme!
              .colorScheme
              .copyWith(primary: primaryColor, secondary: accentColor),
        );
  }

  static initDefaultThemes() {
    _lightTheme = AppTheme(
      darkMode: false,
      backgroundColor: ColorUtils.hexToColor('#fafafa'),
      cardColor: ColorUtils.hexToColor('#ffffff'),
      lineColor: ColorUtils.hexToColor('#eeeeee'),
    );

    _darkTheme = AppTheme(
      darkMode: true,
      backgroundColor: ColorUtils.hexToColor('#303030'),
      cardColor: ColorUtils.hexToColor('#3f3f3f'),
      lineColor: ColorUtils.hexToColor('#3a3a3a'),
    );
  }
}
