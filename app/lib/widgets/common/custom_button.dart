import 'package:flutter/material.dart';

class CustomButton extends StatelessWidget {
  final bool border;
  final bool outline;
  final String text;
  final IconData icon;
  final Function onPressed;
  final bool loading;
  final Color backgroundColor;

  const CustomButton({
    Key key,
    @required this.text,
    @required this.onPressed,
    this.outline = false,
    this.border = true,
    this.loading = false,
    this.backgroundColor,
    this.icon,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      child: new Container(
        decoration: BoxDecoration(
          border: border
              ? Border.all(color: Theme.of(context).primaryColor, width: 1.0)
              : null,
          borderRadius: BorderRadius.circular(25.0),
          color: backgroundColor != null
              ? backgroundColor
              : (outline ? Colors.transparent : Theme.of(context).primaryColor),
        ),
        child: new Material(
          child: new InkWell(
            borderRadius: BorderRadius.circular(25.0),
            onTap: () {
              if (!loading) onPressed();
            },
            child: Center(
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: <Widget>[
                    if (loading)
                      Container(
                        padding: EdgeInsets.only(right: 10),
                        child: SizedBox(
                          child: CircularProgressIndicator(
                            strokeWidth: 2.0,
                            valueColor: AlwaysStoppedAnimation<Color>(outline
                                ? Theme.of(context).primaryColor
                                : Colors.white),
                          ),
                          height: 16.0,
                          width: 16.0,
                        ),
                      ),
                    if (icon != null)
                      Container(
                        child: Icon(
                          icon,
                          size: 12,
                          color: outline
                              ? Theme.of(context).primaryColor
                              : Colors.white,
                        ),
                        margin: EdgeInsets.only(right: 12),
                      ),
                    Text(
                      text,
                      style: TextStyle(
                          fontSize: 15.0,
                          color: outline
                              ? Theme.of(context).primaryColor
                              : Colors.white),
                    ),
                  ],
                ),
              ),
            ),
          ),
          color: Colors.transparent,
        ),
      ),
    );
  }
}
