"use strict";

(() => {
  function init(elevators: Elevator[], floors: Floor[]) {
    new Controller().init(elevators, floors);
  }

  function update() {}

  return { init, update };
})();
