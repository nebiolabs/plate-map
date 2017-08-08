# coding: utf-8
require File.expand_path('../lib/plate/map/rails/version', __FILE__)

Gem::Specification.new do |spec|
  spec.name          = "plate-map-rails"
  spec.version       = Plate::Map::Rails::VERSION
  spec.authors       = ["Eric Kappotis"]
  spec.email         = ["eric.kappotis@altran.com"]

  spec.summary       = "plate-map packaged for Rails asset pipeline"
  spec.description   = "plate-map packaged for Rails asset pipeline"
  spec.homepage      = "TODO: Put your gem's website or public repo URL here."

  spec.files        = `git ls-files`.split("\n").reject { |f| f =~ /^testapp|^plate-map/ }
  spec.executables  = `git ls-files -- bin/*`.split("\n").map { |f| File.basename(f) }
  spec.require_path = 'lib'

  spec.add_development_dependency "bundler", "~> 1.15"
  spec.add_development_dependency "rake", "~> 10.0"
  spec.add_development_dependency "minitest", "~> 5.0"
end
