// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'starter.StorageService'])

  .run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }
    });
  })

  .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider

      .state('app', {
        url: '/app',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'AppCtrl'
      })

      .state('app.status', {
        url: '/status',
        views: {
          'menuContent': {
            templateUrl: 'templates/status.html',
            controller: 'StatusCtrl'
          }
        }
      })

      .state('app.liveMonitoring', {
        url: '/liveMonitoring',
        views: {
          'menuContent': {
            templateUrl: 'templates/liveMonitoring.html',
            controller: 'LiveMonitoringCtrl'
          }
        }
      })
      .state('app.statistics', {
        url: '/statistics',
        views: {
          'menuContent': {
            templateUrl: 'templates/statistics.html',
            controller: 'StatisticsCtrl'
          }
        }
      })
      .state('app.tips', {
        url: '/tips',
        views: {
          'menuContent': {
            templateUrl: 'templates/tips.html',
            controller: 'TipsCtrl'
          }
        }
      })
      .state('app.about', {
        url: '/about',
        views: {
          'menuContent': {
            templateUrl: 'templates/about.html',
            controller: 'AboutCtrl'
          }
        }
      })
      .state('app.contact', {
        url: '/contact',
        views: {
          'menuContent': {
            templateUrl: 'templates/contact.html',
            controller: 'ContactCtrl'
          }
        }
      })
      .state('app.feedback', {
        url: '/feedback',
        views: {
          'menuContent': {
            templateUrl: 'templates/feedback.html',
            controller: 'FeedbackCtrl'
          }
        }
      });


    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/status');
  });
