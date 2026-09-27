import ExpoModulesCore

public class CalendarFocusObserverModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CalendarFocusObserver")

    View(CalendarFocusObserverView.self) {
      Events("onAccessibilityFocused")
      Prop("identity") { (view: CalendarFocusObserverView, identity: String) in
        view.identity = identity
      }
      Prop("dateKey") { (view: CalendarFocusObserverView, dateKey: String) in
        view.dateKey = dateKey
      }
      Prop("generation") { (view: CalendarFocusObserverView, generation: Int) in
        view.generation = generation
      }
    }
  }
}
