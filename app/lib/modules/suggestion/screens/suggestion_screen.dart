import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/modules/suggestion/providers/suggestion_provider.dart';
import 'package:timecalendar/modules/shared/utils/snackbar.dart';
import 'package:timecalendar/modules/shared/widgets/ui/custom_button.dart';

class SuggestionScreen extends StatefulWidget {
  static const routeName = '/suggestion';
  @override
  _SuggestionScreenState createState() => _SuggestionScreenState();
}

class _SuggestionScreenState extends State<SuggestionScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  var _messageFocusNode = FocusNode();
  final _form = GlobalKey<FormState>();

  List<String> subjects = [
    'Signaler un problème',
    'Proposer une fonctionnalité',
    'Autre'
  ];
  String? subject;
  String? email;
  String? message;

  bool _isLoading = false;

  @override
  initState() {
    super.initState();
    resetForm();
  }

  resetForm() {
    setState(() {
      subject = subjects[0];
      message = '';
      email = '';
      _isLoading = false;
    });
    _form.currentState?.reset();
  }

  Future<void> _saveForm(context) async {
    final isValid = _form.currentState!.validate();
    if (!isValid) {
      return;
    }
    _form.currentState!.save();
    setState(() {
      _isLoading = true;
    });

    final suggestionProvider =
        Provider.of<SuggestionProvider>(context, listen: false);
    try {
      await suggestionProvider.sendSuggestion(subject, message, email);
      resetForm();
      showDialog(
        context: context,
        builder: (BuildContext context) {
          // return object of type Dialog
          return AlertDialog(
            title: Text("Message envoyé"),
            content: Text("Merci pour votre message !"),
            actions: <Widget>[
              TextButton(
                child: Text("Fermer"),
                onPressed: () {
                  Navigator.of(context).pop();
                },
              ),
            ],
          );
        },
      );
    } on Exception {
      showSnackBar(
        context,
        SnackBar(
          content: Text('Une erreur est survenue.'),
        ),
      );
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        title: Text('Vos suggestions'),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(15.0),
          child: Form(
            key: _form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                Text(
                    'Merci d\'utiliser TimeCalendar ! Si vous constatez des bugs, ou que vous avez une suggestion, vous pouvez nous contacter ici.'),
                SizedBox(height: 20),
                Text(
                  'Vous souhaitez',
                  style: TextStyle(color: Colors.grey, fontSize: 12),
                ),
                DropdownButton<String>(
                  isExpanded: true,
                  value: subject,
                  onChanged: (String? newValue) {
                    setState(() {
                      subject = newValue;
                    });
                  },
                  items: subjects.map<DropdownMenuItem<String>>((String value) {
                    return DropdownMenuItem<String>(
                      value: value,
                      child: Text(value),
                    );
                  }).toList(),
                ),
                TextFormField(
                  decoration: InputDecoration(labelText: 'Adresse e-mail'),
                  validator: (value) {
                    if (value!.isEmpty) {
                      return 'Vous devez entrer votre adresse e-mail.';
                    }
                    Pattern pattern =
                        r'^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$';
                    RegExp regex = RegExp(pattern as String);
                    if (!regex.hasMatch(value)) {
                      return 'Votre adresse e-mail est invalide.';
                    }
                    return null;
                  },
                  onSaved: (value) {
                    setState(() {
                      email = value;
                    });
                  },
                  textInputAction: TextInputAction.next,
                  keyboardType: TextInputType.emailAddress,
                  onFieldSubmitted: (_) {
                    FocusScope.of(context).requestFocus(_messageFocusNode);
                  },
                ),
                TextFormField(
                  minLines: 3,
                  maxLines: 6,
                  keyboardType: TextInputType.multiline,
                  decoration:
                      InputDecoration(labelText: 'Entrez votre message'),
                  focusNode: _messageFocusNode,
                  validator: (value) {
                    if (value!.isEmpty) {
                      return 'Vous devez entrer votre message.';
                    }
                    return null;
                  },
                  onSaved: (value) {
                    setState(() {
                      message = value;
                    });
                  },
                ),
                SizedBox(
                  height: 15,
                ),
                CustomButton(
                  text: 'Envoyer',
                  onPressed: () {
                    _saveForm(context);
                  },
                  loading: _isLoading,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
