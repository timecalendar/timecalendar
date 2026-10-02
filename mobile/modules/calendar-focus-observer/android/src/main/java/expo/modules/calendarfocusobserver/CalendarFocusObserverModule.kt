package expo.modules.calendarfocusobserver

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class CalendarFocusObserverModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("CalendarFocusObserver")

    View(CalendarFocusObserverView::class) {
      Events("onAccessibilityFocused")
      Prop("identity") { view: CalendarFocusObserverView, identity: String ->
        view.identity = identity
      }
      Prop("dateKey") { view: CalendarFocusObserverView, dateKey: String ->
        view.dateKey = dateKey
      }
      Prop("pageKey") { view: CalendarFocusObserverView, pageKey: String ->
        view.pageKey = pageKey
      }
      GroupView<CalendarFocusObserverView> {
        AddChildView<android.view.View> { parent, child, index ->
          require(parent.childCount == 0 && index == 0)
          parent.addView(child, android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
            android.widget.LinearLayout.LayoutParams.MATCH_PARENT
          ))
        }
        GetChildCount { view -> view.childCount }
        GetChildViewAt<android.view.View> { view, index -> view.getChildAt(index) }
        RemoveChildViewAt { view, index -> view.removeViewAt(index) }
      }
    }
  }
}
