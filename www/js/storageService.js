angular.module('starter.StorageService', [])

  .service('StorageService', function () {
    return {
      saveData: function (key, item) {
        window.localStorage.setItem(key, JSON.stringify(item));
      },

      loadData: function (key) {
        return JSON.parse(window.localStorage.getItem(key));
      },

      clearData: function () {
        window.localStorage.clear();
      }
    };
  })
