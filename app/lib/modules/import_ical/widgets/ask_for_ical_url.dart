import 'package:flutter/material.dart';
import 'package:timecalendar/modules/shared/widgets/ui/custom_button.dart';

class AskForIcalUrl extends StatelessWidget {
  final TextEditingController _textFieldController = TextEditingController();
  final void Function(String)? onSubmit;

  AskForIcalUrl({Key? key, this.onSubmit}) : super(key: key);

  _displayDialog(BuildContext context) async {
    return showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text("Entrez l'URL de votre calendrier"),
          content: TextField(
            controller: _textFieldController,
            decoration:
                InputDecoration(hintText: "Collez ici le lien du calendrier"),
          ),
          actions: <Widget>[
            TextButton(
              child: new Text('Annuler'),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
            TextButton(
              child: new Text('Importer'),
              onPressed: () async {
                Navigator.of(context).pop();

                await Future.delayed(Duration(milliseconds: 200));

                onSubmit!(_textFieldController.text);
              },
            )
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return CustomButton(
      text: 'ou entrez l\'URL du calendrier',
      outline: true,
      border: false,
      onPressed: () => _displayDialog(context),
    );
  }
}
