package expo.modules.calendarfocusobserver

import android.content.Context
import android.view.View
import android.view.accessibility.AccessibilityEvent
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

class CalendarFocusObserverView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  var identity = ""
  var dateKey = ""
  var generation = -1
  private val onAccessibilityFocused by EventDispatcher<Map<String, Any>>()

  init {
    importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
  }

  override fun requestSendAccessibilityEvent(child: View, event: AccessibilityEvent): Boolean {
    if (
      isAttachedToWindow && childCount == 1 && child === getChildAt(0) &&
      event.eventType == AccessibilityEvent.TYPE_VIEW_ACCESSIBILITY_FOCUSED &&
      identity.isNotEmpty() && generation >= 0
    ) {
      onAccessibilityFocused(mapOf(
        "identity" to identity,
        "dateKey" to dateKey,
        "generation" to generation
      ))
    }
    return super.requestSendAccessibilityEvent(child, event)
  }
}
