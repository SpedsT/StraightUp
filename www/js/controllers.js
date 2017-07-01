angular.module('starter.controllers', [])

  .controller('AppCtrl', function ($scope, $ionicModal, $timeout) {

  })

  /*
      #########################
      ### Status Controller ###
      #########################
  */
  .controller('StatusCtrl', function ($scope, $ionicLoading, $ionicPopover, $ionicPopup, Devices, BLE, $interval, StorageService) {

    $scope.upperIsCalibrated = false;
    $scope.lowerIsCalibrated = false;
    $scope.isSitting = true;
    var dateOfLastMessageRecieved = null
    if (StorageService.loadData('dateOfLastMessageRecieved')) dateOfLastMessageRecieved = StorageService.loadData('dateOfLastMessageRecieved');
    $scope.upperDevice = null;
    $scope.lowerDevice = null;
    $scope.upperMessage = [];
    $scope.lowerMessage = [];
    $scope.isUpperConnected = false;
    $scope.isLowerConnected = false;
    var upperDeviceOptions = {
      characteristic: "",
      service: ""
    };
    var lowerDeviceOptions = {
      characteristic: "",
      service: ""
    };

    document.addEventListener("deviceready", onDeviceReady, false);

    function onDeviceReady() {

      // Start to scan for available devices
      //
      ble.isEnabled(
        function () {
          console.log("Bluetooth is enabled");
        },
        function () {
          $ionicPopup.alert({
            title: 'WARNING!',
            template: 'Bluetooth is not enabled!'
          });
        });

      // initial scan
      BLE.scan().then(success, failure);
    }


    // keep a reference since devices will be added
    $scope.devices = Devices.all();

    var success = function () {
      if ($scope.devices.length < 1) {
        // a better solution would be to update a status message rather than an alert
        alert("Didn't find any Bluetooth Low Energy devices.");
      }
    };

    var failure = function (error) {
      alert(error);
    };

    // pull to refresh
    $scope.onRefresh = function () {
      BLE.scan().then(
        success, failure
      ).finally(
        function () {
          $scope.$broadcast('scroll.refreshComplete');
        }
      )
    }

    $scope.$on('stopLoading', function (event, args) {
      $ionicLoading.hide();
    });

    // Popovers
    //
    $ionicPopover.fromTemplateUrl('templates/upperPopover.html', {
      scope: $scope
    }).then(function (upperPopover) {
      $scope.upperPopover = upperPopover;
    });

    $ionicPopover.fromTemplateUrl('templates/lowerPopover.html', {
      scope: $scope
    }).then(function (lowerPopover) {
      $scope.lowerPopover = lowerPopover;
    });

    $ionicPopover.fromTemplateUrl('templates/calibrationPopover.html', {
      scope: $scope
    }).then(function (calibrationPopover) {
      $scope.calibrationPopover = calibrationPopover;
    });

    $scope.openUpperPopover = function ($event) {
      $scope.upperPopover.show($event);
    };

    $scope.openLowerPopover = function ($event) {
      $scope.lowerPopover.show($event);
    };

    $scope.openCalibrationPopover = function ($event) {
      $scope.calibrationPopover.show($event);
    };

    $scope.closeUpperPopover = function () {
      $scope.upperPopover.hide();
    };

    $scope.closeLowerPopover = function () {
      $scope.lowerPopover.hide();
    };

    $scope.closeCalibrationPopover = function () {
      $scope.calibrationPopover.hide();
    };

    //Cleanup the popover when we're done with it!
    $scope.$on('$destroy', function () {
      $scope.upperPopover.remove();
      $scope.lowerPopover.remove();
      $scope.calibrationPopover.remove();
    });

    // Connectivity
    //
    $scope.connectUpperBluetooth = function (upperDeviceID) {
      console.log("Connecting upper to " + upperDeviceID);

      $ionicLoading.show({
        template: '<ion-spinner> icon="android" </ion-spinner> <br/> Connecting'
      });

      BLE.connect(upperDeviceID, upperDeviceOptions).then(
        function (peripheral) {
          $scope.upperDevice = peripheral;
          BLE.startNotification(upperDeviceID, upperDeviceOptions, $scope.upperMessageRecieved);
        }
      );
      $scope.closeUpperPopover();
    };

    $scope.disconnectUpperPopover = function () {
      if ($scope.isUpperConnected) {
        BLE.stopNotification($scope.upperDevice.id, upperDeviceOptions);
        BLE.disconnect($scope.upperDevice.id);
        $scope.upperDevice = null;
        upperDeviceOptions.characteristic = "";
        upperDeviceOptions.service = "";
        $scope.isUpperConnected = false;
      }

    }

    $scope.connectLowerBluetooth = function (lowerDeviceID) {
      console.log("Connecting lower to " + lowerDeviceID);

      $ionicLoading.show({
        template: '<ion-spinner> icon="android" </ion-spinner> <br/> Connecting'
      });

      BLE.connect(lowerDeviceID, lowerDeviceOptions).then(
        function (peripheral) {
          $scope.lowerDevice = peripheral;
          BLE.startNotification(lowerDeviceID, lowerDeviceOptions, $scope.lowerMessageRecieved);
        }
      );

      $scope.closeLowerPopover();
    };

    $scope.disconnectLowerPopover = function () {
      if ($scope.isLowerConnected) {
        BLE.stopNotification($scope.lowerDevice.id, lowerDeviceOptions);
        BLE.disconnect($scope.lowerDevice.id);
        $scope.lowerDevice = null;
        lowerDeviceOptions.characteristic = "";
        lowerDeviceOptions.service = "";
        $scope.isLowerConnected = false;
      }
    }

    // Connectivity checkings
    //
    $interval(function () {

      // Upper
      if ($scope.upperDevice) {
        ble.isConnected(
          $scope.upperDevice.id,
          function () {
            $scope.isUpperConnected = true;
          },
          function () {
            $scope.upperDevice = null;
            upperDeviceOptions.characteristic = "";
            upperDeviceOptions.service = "";
            $scope.isUpperConnected = false;
          }
        );
      } else {
        $scope.upperDevice = null;
        upperDeviceOptions.characteristic = "";
        upperDeviceOptions.service = "";
        $scope.isUpperConnected = false;
      };

      // Lower
      if ($scope.lowerDevice) {
        ble.isConnected(
          $scope.lowerDevice.id,
          function () {
            $scope.isLowerConnected = true;
          },
          function () {
            $scope.lowerDevice = null;
            lowerDeviceOptions.characteristic = "";
            lowerDeviceOptions.service = "";
            $scope.isLowerConnected = false;
          }
        );
      } else {
        $scope.lowerDevice = null;
        lowerDeviceOptions.characteristic = "";
        lowerDeviceOptions.service = "";
        $scope.isLowerConnected = false;
      }
    }, 1000);

    // Send Calibration message
    //
    $scope.calibrate = function () {
      $scope.upperIsCalibrated = false;
      $scope.lowerIsCalibrated = false;

      if ($scope.upperDevice) BLE.sendData($scope.upperDevice.id, upperDeviceOptions, BLE.stringToBytes("Calibrate"));
      if ($scope.lowerDevice) BLE.sendData($scope.lowerDevice.id, lowerDeviceOptions, BLE.stringToBytes("Calibrate"));
    }

    // Recieving messages
    //
    $scope.upperMessageRecieved = function (upperMessage) {

      // Mark when the message was recieved
      // var currentdate = new Date();
      // var dateOfLastMessageRecieved = StorageService.loadData('dateOfLastMessageRecieved');

      // if (Math.abs(currentDate - dateOfLastMessageRecieved))

      // StorageService.saveData('dateOfLastMessageRecieved', currentdate);

      // Checking for the calibration
      if (upperMessage.includes("Calibrated")) {
        $scope.upperIsCalibrated = true;
        if ($scope.lowerIsCalibrated) {
          $scope.closeCalibrationPopover();
          alert("Calibrated!");
        }
      }

      // Parse the message
      if (upperMessage != "" && upperMessage != null) $scope.upperMessage = upperMessage.split(", ");

      // Send the data to local storage for the statistics
      StorageService.saveData('upperPositions', $scope.upperMessage);

      console.log($scope.upperMessage);
    }

    $scope.lowerMessageRecieved = function (lowerMessage) {

      // Checking for the calibration
      if (lowerMessage.includes("Calibrated")) {
        $scope.lowerIsCalibrated = true;
        if ($scope.upperIsCalibrated) {
          $scope.closeCalibrationPopover();
          alert("Calibrated!");
        }
      }

      // Parse the message
      if (lowerMessage != "" && upperMessage != null) $scope.lowerMessage = lowerMessage.split(", ");

      // Send the data to local storage for the statistics
      StorageService.saveData('lowerPositions', $scope.lowerMessage);

      console.log($scope.lowerMessage);
    }

    // End of Stats controller
  })


  /*
      ##################################
      ### Live Monitoring Controller ###
      ##################################
  */
  .controller('LiveMonitoringCtrl', function ($scope) {

    $scope.options = {
      loop: true,
      effect: 'slide',
      speed: 500,
      onInit: function (swiper) {
        $scope.sw = swiper;
      }
    };

  })


  /*
      #############################
      ### Statistics Controller ###
      #############################
  */
  .controller('StatisticsCtrl', function ($scope) {

    var lastWeekChartID = document.getElementById("lastWeek").getContext('2d');
    var todayChartID = document.getElementById("today").getContext('2d');
    var deviationsChartID = document.getElementById("deviations").getContext('2d');

    var pointBackgroundColor = [
      'rgba(255, 255, 255, 1)',
      'rgba(255, 255, 255, 1)',
      'rgba(255, 255, 255, 1)',
      'rgba(255, 255, 255, 1)',
      'rgba(255, 255, 255, 1)',
      'rgba(255, 255, 255, 1)',
      'rgba(255, 255, 255, 1)',
      'rgba(255, 255, 255, 1)',
      'rgba(255, 255, 255, 1)',
      'rgba(255, 255, 255, 1)',
      'rgba(255, 255, 255, 1)',
      'rgba(255, 255, 255, 1)',
      'rgba(255, 255, 255, 1)',
      'rgba(255, 255, 255, 1)',
      'rgba(255, 255, 255, 1)',
      'rgba(255, 255, 255, 1)'
    ]

    var lastWeekData = {
      datasets: [{
        label: 'Percentage of time in correct position',
        data: [50, 20, 25, 35, 50, 55, 80],
        backgroundColor: 'rgba(179, 229, 252, 0.35)',
        borderColor: 'rgba(179, 229, 252, 1)',
        pointBackgroundColor: pointBackgroundColor,
        borderWidth: 3
      }],
      labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    };

    var todayData = {
      datasets: [{
        label: 'Percentage of time in correct position',
        data: [20, 65, 85, 50, 55, 20, 34, 20, 10, 0, 20, 60, 90, 100, 45, 60, 65],
        backgroundColor: 'rgba(165, 214, 167, 0.35)',
        borderColor: 'rgba(165, 214, 167, 1)',
        pointBackgroundColor: pointBackgroundColor,
        borderWidth: 3
      }],
      labels: ['8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '00']
    };

    var deviationsData = {
      labels: ['Forwards', 'Rotated right', 'Leaned right', 'Backwards', 'Leaned left', 'Rotated left'],
      datasets: [{
          label: 'Today',
          data: [7, 4, 6, 2, 4, 8],
          backgroundColor: 'rgba(165, 214, 167, 0.35)',
          borderColor: 'rgba(165, 214, 167, 1)',
          pointBackgroundColor: pointBackgroundColor,
          borderWidth: 3
        },
        {
          label: 'Last week',
          data: [9, 3, 6, 3, 8, 6],
          backgroundColor: 'rgba(179, 229, 252, 0.35)',
          borderColor: 'rgba(179, 229, 252, 1)',
          pointBackgroundColor: pointBackgroundColor,
          borderWidth: 3
        }
      ]
    }

    var options = [{
      elements: {
        point: {
          hitRadius: 100,
        }
      },
    }];


    var lastWeekChart = new Chart(lastWeekChartID, {
      type: 'line',
      data: lastWeekData,
      options: options,
    });

    var todayChart = new Chart(todayChartID, {
      type: 'line',
      data: todayData,
      options: options,
    });

    var deviationsChart = new Chart(deviationsChartID, {
      type: 'radar',
      data: deviationsData,
      options: options,
    });

  })


  /*
      #######################
      ### Tips Controller ###
      #######################  
  */
  .controller('TipsCtrl', function ($scope) {

  })


  /*
      ########################
      ### About Controller ###
      ########################
  */
  .controller('AboutCtrl', function ($scope) {

  })


  /*
      ##########################
      ### Contact Controller ###
      ##########################
  */
  .controller('ContactCtrl', function ($scope) {

  })


  /*
      ###########################
      ### Feedback Controller ###
      ###########################
  */
  .controller('FeedbackCtrl', function ($scope) {
    $scope.ratingFull = {};
    $scope.ratingFull.rate = 3;
    $scope.ratingFull.max = 5;

    $scope.ratingHalf = {};
    $scope.ratingHalf.rate = 3.5;
    $scope.ratingHalf.max = 5;

    $scope.reset = function () {
      $scope.ratingFull.rate = 0;
    }
  })
