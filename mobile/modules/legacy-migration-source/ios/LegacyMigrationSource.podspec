Pod::Spec.new do |s|
  s.name = 'LegacyMigrationSource'
  s.version = '1.0.0'
  s.summary = 'Read-only Flutter migration source discovery'
  s.description = 'Discovers the fixed legacy database and six typed native preferences.'
  s.author = 'TimeCalendar'
  s.homepage = 'https://github.com/timecalendar/timecalendar'
  s.platforms = { :ios => '16.4' }
  s.source = { git: 'https://github.com/timecalendar/timecalendar.git' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
