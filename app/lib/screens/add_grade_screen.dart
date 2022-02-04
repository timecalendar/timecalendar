import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/providers/assistant_provider.dart';
import 'package:timecalendar/screens/assistant_screen.dart';
import 'package:timecalendar/widgets/common/custom_button.dart';

class AddGradeScreen extends StatefulWidget {
  static const routeName = '/add-grade';

  @override
  _AddGradeScreenState createState() => _AddGradeScreenState();
}

class _AddGradeScreenState extends State<AddGradeScreen> {
  final _form = GlobalKey<FormState>();
  String? gradeName;

  Future<void> _saveForm(context) async {
    final isValid = _form.currentState!.validate();
    if (!isValid) {
      return;
    }
    _form.currentState!.save();

    var assistantProvider =
        Provider.of<AssistantProvider>(context, listen: false);
    assistantProvider.gradeName = gradeName;

    var nextScreen = assistantProvider.getAssistantConnectionScreen();

    Navigator.of(context)
        .pushNamed(nextScreen)
        .then((result) {
      if (nextScreen == AssistantScreen.routeName) {
        // Callback assistant screen
        assistantProvider.assistantCallback(context, result as Map<String, dynamic>?);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final availableWidth = mediaQuery.size.width - 200;

    return Scaffold(
      body: Column(
        children: <Widget>[
          Expanded(
            child: CustomScrollView(
              physics: AlwaysScrollableScrollPhysics(),
              slivers: <Widget>[
                SliverAppBar(
                  pinned: true,
                  flexibleSpace: FlexibleSpaceBar(
                    title: ConstrainedBox(
                      constraints: BoxConstraints(
                        maxWidth: availableWidth,
                      ),
                      child: Text(
                        "Importer votre calendrier",
                        style: TextStyle(fontSize: 18),
                      ),
                    ),
                  ),
                  expandedHeight: 200.0,
                ),
                SliverList(
                  delegate: SliverChildListDelegate([
                    Padding(
                      padding: const EdgeInsets.all(15.0),
                      child: Form(
                        key: _form,
                        child: Column(
                          children: <Widget>[
                            Text(
                                'Pour importer votre emploi du temps, entrez le nom de votre formation.'),
                            SizedBox(height: 15),
                            TextFormField(
                              decoration: InputDecoration(
                                  labelText: 'Nom de votre formation'),
                              validator: (value) {
                                if (value!.isEmpty) {
                                  return 'Vous devez entrer le nom de votre formation.';
                                }
                                return null;
                              },
                              onSaved: (value) {
                                setState(() {
                                  gradeName = value;
                                });
                              },
                              textInputAction: TextInputAction.next,
                              onFieldSubmitted: (_) {
                                _saveForm(context);
                              },
                            ),
                          ],
                        ),
                      ),
                    )
                  ]),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(15.0),
            child: Row(
              children: <Widget>[
                CustomButton(
                  text: 'Retour',
                  outline: true,
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                ),
                Expanded(
                  child: Container(),
                ),
                CustomButton(
                  text: 'Suivant',
                  onPressed: () {
                    _saveForm(context);
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
