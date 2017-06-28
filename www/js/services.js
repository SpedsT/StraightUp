angular.module('starter.services', [])

  .factory('Devices', function () {
    // Might use a resource here that returns a JSON array

    // Some fake testing data
    var devices = [];

    return {
      all: function () {
        return devices;
      },
      clean: function () {
        devices.splice(0, devices.length);
      },
      remove: function (device) {
        devices.splice(devices.indexOf(device), 1);
      },
      get: function (deviceId) {
        for (var i = 0; i < chats.length; i++) {
          if (devices[i].id === parseInt(deviceId)) {
            return devices[i];
          }
        }
        return null;
      },
      add: function (device) {
        devices.push(device);
      }
    };
  })

  .factory('BLE', function ($q, $interval, Devices, $rootScope) {

    var connected = null;
    var service = null;
    var characteristic = null;
    var dataQueue = [];

    var ret = {
      recievedData: "",

      stringToBytes: function (string) {
        var array = new Uint8Array(string.length);
        for (var i = 0, l = string.length; i < l; i++) {
          array[i] = string.charCodeAt(i);
        }
        return array.buffer;
      },

      bytesToString: function (buffer) {
        return String.fromCharCode.apply(null, new Uint8Array(buffer));
      },

      isConnected: function () {
        return connected !== null;
      },

      // Scan
      scan: function () {
        Devices.clean();
        var deferred = $q.defer();

        // disconnect the connected device (hack, device should disconnect when leaving detail page)
        if (connected) {
          ret.disconnect();
        }

        ble.startScan([], /* scan for all services */
          function (peripheral) {
            Devices.add(peripheral);
          },
          function (error) {
            deferred.reject(error);
          });

        // stop scan after 5 seconds
        setTimeout(ble.stopScan, 5000,
          function () {
            deferred.resolve();
          },
          function () {
            console.log("stopScan failed");
            deferred.reject("Error stopping scan");
          }
        );

        return deferred.promise;
      },

      // Disconnect
      disconnect: function (deviceId) {
        ble.disconnect(deviceId, function () {
          alert("Disconnected " + deviceId);
          console.log("Disconnected " + deviceId);
        });
        connected = null;
      },

      // Connect
      connect: function (deviceId) {
        var deferred = $q.defer();

        ble.connect(deviceId,
          function (peripheral) {

            connected = peripheral;
            deferred.resolve(peripheral);
            angular.forEach(connected.characteristics, function (c) {
              var props = c.properties;
              var hasWrite = props.indexOf("Write") > 0 || props.indexOf("WriteWithoutResponse") > 0;
              if (hasWrite) {
                characteristic = c.characteristic;
                service = c.service;
              }
            });
            console.log("Connected to " + deviceId);
            $rootScope.$broadcast('stopLoading');
          },
          function (reason) {
            deferred.reject(reason);
            $rootScope.$broadcast('stopLoading');
            alert("Could not connect!");
          }
        );

        return deferred.promise;
      },

      // Send Data
      sendData: function (data) {
        var deferred = $q.defer();
        ble.writeWithoutResponse(connected.id, service, characteristic, data,
          function (response) {
            deferred.resolve(response);
          },
          function (response) {
            alert("Send error: " + response);
            deferred.reject(response);
          });
        return deferred.promise;
      },

      // Add queue
      addQueue: function (d) {
        if (dataQueue.length <= 3)
          dataQueue.push(d);
      },

      // startNotification
      startNotification: function () {
        ble.startNotification(connected.id, service, characteristic,
          function (data) {
            if (ret.bytesToString(data) != "")
              ret.recievedData = ret.bytesToString(data);
          },
          function (response) {
            alert("Notification error: " + response);
          });
      },

      // stopNotification
      stopNotification: function () {
        ble.stopNotification(connected.id, service, characteristic,
          function () {
            alert("Notifications stopped!");
          },
          function (response) {
            alert("Notification error: " + response);
          });
        return ret.recievedData;
      }
    };

    $interval(function () {
      if (dataQueue.length > 0 && connected !== null) {
        var d = dataQueue.shift();
        ret.sendData(d);
      }
    }, 250);
    return ret;
  });
