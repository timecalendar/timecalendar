import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/providers/assistant_provider.dart';
import 'package:timecalendar/widgets/common/custom_button.dart';

import 'add_grade_screen.dart';
import 'import_ical_screen.dart';

class AddSchoolScreen extends StatefulWidget {
  static const routeName = '/add-school';

  @override
  _AddSchoolScreenState createState() => _AddSchoolScreenState();
}

class _AddSchoolScreenState extends State<AddSchoolScreen> {
  final _form = GlobalKey<FormState>();
  String schoolName;

  Future<void> _saveForm() async {
    final isValid = _form.currentState.validate();
    if (!isValid) {
      return;
    }
    _form.currentState.save();

    var assistantProvider =
        Provider.of<AssistantProvider>(context, listen: false);
    assistantProvider.schoolName = schoolName;

    Navigator.of(context).pushNamed(AddGradeScreen.routeName).then((result) {
      if (result == 'end') {
        Navigator.of(context).pushNamed(ImportIcalScreen.routeName,
            arguments: ImportIcalScreenArguments(false));
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
                        "Ajouter un établissement",
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
                                'Pour importer votre emploi du temps, entrez le nom de votre établissement.'),
                            SizedBox(height: 15),
                            TextFormField(
                              decoration: InputDecoration(
                                  labelText: 'Nom de votre établissement'),
                              validator: (value) {
                                if (value.isEmpty) {
                                  return 'Vous devez entrer le nom de votre établissement.';
                                }
                                return null;
                              },
                              onSaved: (value) {
                                setState(() {
                                  schoolName = value;
                                });
                              },
                              textInputAction: TextInputAction.next,
                              onFieldSubmitted: (_) {
                                _saveForm();
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
                    _saveForm();
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
