Pod::Spec.new do |s|
  s.name           = 'CalendarFocusObserver'
  s.version        = '1.0.0'
  s.summary        = 'Calendar event accessibility focus observer'
  s.description    = 'Reports native accessibility focus for one calendar event target.'
  s.author         = 'TimeCalendar'
  s.homepage       = 'https://github.com/timecalendar/timecalendar'
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: 'https://github.com/timecalendar/timecalendar.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
