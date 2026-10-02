import ExpoModulesCore
import UIKit

class CalendarFocusObserverView: ExpoView {
  var identity = ""
  var dateKey = ""
  let onAccessibilityFocused = EventDispatcher()
  private var observer: NSObjectProtocol?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    isAccessibilityElement = false
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    stopObserving()
    guard window != nil else { return }
    observer = NotificationCenter.default.addObserver(
      forName: UIAccessibility.elementFocusedNotification,
      object: nil,
      queue: .main
    ) { [weak self] notification in
      self?.handleFocus(notification)
    }
  }

  deinit {
    stopObserving()
  }

  private func stopObserving() {
    if let observer {
      NotificationCenter.default.removeObserver(observer)
      self.observer = nil
    }
  }

  private func handleFocus(_ notification: Notification) {
    guard window != nil, !identity.isEmpty,
      let target = subviews.first, subviews.count == 1,
      let focused = notification.userInfo?[UIAccessibility.focusedElementUserInfoKey]
    else { return }

    var element: Any? = focused
    var matchesTarget = false
    for _ in 0..<8 {
      if let view = element as? UIView {
        matchesTarget = view === target || view.isDescendant(of: target)
        break
      }
      element = (element as? UIAccessibilityElement)?.accessibilityContainer
      if element == nil { break }
    }
    guard matchesTarget else { return }
    onAccessibilityFocused([
      "identity": identity,
      "dateKey": dateKey,
    ])
  }
}
