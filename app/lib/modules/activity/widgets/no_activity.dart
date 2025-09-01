import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

class NoActivity extends StatelessWidget {
  const NoActivity({Key? key, required this.appBar}) : super(key: key);

  final AppBar appBar;

  @override
  Widget build(BuildContext context) {
    return PageView(
      scrollDirection: Axis.vertical,
      physics: const AlwaysScrollableScrollPhysics(),
      children: <Widget>[
        Container(
          height:
              MediaQuery.of(context).size.height - appBar.preferredSize.height,
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: <Widget>[
                Icon(FontAwesomeIcons.list, size: 70),
                SizedBox(height: 20),
                Text(
                  "Vous n'avez pas reçu de modification de cours.",
                  style: TextStyle(fontSize: 18),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
