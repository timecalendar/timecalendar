import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/modules/school/screens/school_selection/school_selection_screen.dart';
import 'package:timecalendar/utils/constants.dart';
import 'package:timecalendar/providers/settings_provider.dart';

class OnboardingScreen extends StatefulWidget {
  static const routeName = '/onboarding';

  @override
  _OnboardingScreenState createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final int _numPages = 3;
  final PageController _pageController = PageController(initialPage: 0);
  int _currentPage = 0;
  final kTitleStyle = TextStyle(
    color: Colors.white,
    fontSize: 26.0,
    height: 1.5,
  );

  final kSubtitleStyle = TextStyle(
    color: Colors.white,
    fontSize: 18.0,
    height: 1.4,
  );

  @override
  void initState() {
    super.initState();
    Future.delayed(Duration.zero).then((_) {
      Provider.of<SettingsProvider>(context, listen: false).currentVersion =
          Constants.currentVersion;
    });
  }

  List<Widget> _buildPageIndicator() {
    List<Widget> list = [];
    for (var i = 0; i < _numPages; i++) {
      list.add(i == _currentPage ? _indicator(true) : _indicator(false));
    }

    return list;
  }

  Widget _indicator(bool isActive) {
    return AnimatedContainer(
      duration: Duration(milliseconds: 150),
      margin: EdgeInsets.symmetric(
        horizontal: 8.0,
      ),
      height: 8.0,
      width: isActive ? 24.0 : 16.0,
      decoration: BoxDecoration(
        color: isActive ? Colors.pink : Colors.white,
        borderRadius: BorderRadius.all(Radius.circular(12)),
      ),
    );
  }

  void closeOnboarding(BuildContext context) {
    Navigator.pushNamedAndRemoveUntil(
        context, SelectSchool.routeName, (_) => false);
  }

  @override
  Widget build(BuildContext context) {
    var mediaQuery = MediaQuery.of(context);
    var paddingBottom = mediaQuery.padding.bottom;
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            stops: [0.1, 0.9],
            colors: [
              Color(0xFFF76262),
              Color(0xFFE66B9A),
            ],
          ),
        ),
        child: Padding(
          padding: EdgeInsets.only(top: mediaQuery.padding.top),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Container(
                alignment: Alignment.centerRight,
                height: 60,
                child: (_currentPage != _numPages - 1)
                    ? TextButton(
                        onPressed: () {
                          closeOnboarding(context);
                        },
                        child: Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: Text(
                            'Passer',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 20.0,
                            ),
                          ),
                        ),
                      )
                    : Container(),
              ),
              Expanded(
                child: PageView(
                  physics: ClampingScrollPhysics(),
                  controller: _pageController,
                  onPageChanged: (int page) {
                    setState(() {
                      _currentPage = page;
                    });
                  },
                  children: <Widget>[
                    Padding(
                      padding: const EdgeInsets.all(40.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: <Widget>[
                          Center(
                            child: Image(
                              image: AssetImage('assets/images/home.png'),
                              height: mediaQuery.size.height * 0.25,
                            ),
                          ),
                          SizedBox(
                            height: 30.0,
                          ),
                          Text(
                            'Consultez votre agenda',
                            style: kTitleStyle,
                          ),
                          SizedBox(
                            height: 15.0,
                          ),
                          Text(
                            'Nous récupérons votre calendrier directement auprès de votre établissement',
                            style: kSubtitleStyle,
                          )
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(40.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: <Widget>[
                          Center(
                            child: Image(
                              image:
                                  AssetImage('assets/images/notifications.png'),
                              height: mediaQuery.size.height * 0.25,
                            ),
                          ),
                          SizedBox(
                            height: 30.0,
                          ),
                          Text(
                            'Recevez des notifications',
                            style: kTitleStyle,
                          ),
                          SizedBox(
                            height: 15.0,
                          ),
                          Text(
                            'Soyez alerté lors d\'un ajout, d\'une modification ou d\'une suppression de cours',
                            style: kSubtitleStyle,
                          )
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(40.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: <Widget>[
                          Center(
                            child: Image(
                              image: AssetImage('assets/images/schools.png'),
                              height: mediaQuery.size.height * 0.25,
                            ),
                          ),
                          SizedBox(
                            height: 30.0,
                          ),
                          Text(
                            'Bienvenue dans TimeCalendar !',
                            style: kTitleStyle,
                          ),
                          SizedBox(
                            height: 15.0,
                          ),
                          Text(
                            'Consultez votre emploi du temps universitaire',
                            style: kSubtitleStyle,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: _buildPageIndicator(),
                ),
              ),
              _currentPage != _numPages - 1
                  ? Container(
                      margin: EdgeInsets.only(bottom: paddingBottom),
                      child: Align(
                        alignment: FractionalOffset.bottomRight,
                        child: TextButton(
                          onPressed: () {
                            _pageController.nextPage(
                              duration: Duration(milliseconds: 500),
                              curve: Curves.ease,
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.all(15.0),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              mainAxisSize: MainAxisSize.min,
                              children: <Widget>[
                                Text(
                                  'Suivant',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 20.0,
                                  ),
                                ),
                                SizedBox(
                                  width: 10.0,
                                ),
                                Icon(
                                  Icons.arrow_forward,
                                  color: Colors.white,
                                  size: 30.0,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    )
                  : Text(''),
            ],
          ),
        ),
      ),
      bottomSheet: _currentPage == _numPages - 1
          ? Container(
              height: 80.0 + paddingBottom,
              width: double.infinity,
              color: Colors.white,
              padding: EdgeInsets.only(
                bottom: paddingBottom,
              ),
              child: TextButton(
                onPressed: () {
                  closeOnboarding(context);
                },
                child: Center(
                  child: Text(
                    'C\'est parti !',
                    style: TextStyle(
                      fontSize: 20.0,
                      color: Colors.pink,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            )
          : Text(''),
    );
  }
}
