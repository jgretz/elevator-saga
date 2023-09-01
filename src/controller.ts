type PickupRequest = number;
type StopRequest = number;

class Controller {
  pickupRequests: PickupRequest[];
  stopRequests: { [key: number]: StopRequest[] };

  init(elevators: Elevator[], floors: Floor[]) {
    this.pickupRequests = [];
    this.stopRequests = {};

    this.subscribeToElevatorEvents(elevators);
    this.subscribeToFloorEvents(floors);
  }

  // subscriptions
  subscribeToFloorEvents(floors: Floor[]) {
    const self = this;

    floors.forEach((floor) => {
      const floorNum = floor.floorNum();

      floor.on("up_button_pressed", function () {
        self.requestPickupFromFloor(floorNum);
      });

      floor.on("down_button_pressed", function () {
        self.requestPickupFromFloor(floorNum);
      });
    });
  }

  subscribeToElevatorEvents(elevators: Elevator[]) {
    elevators.forEach((elevator, index) => {
      this.stopRequests[index] = [];
      const self = this;

      elevator.on("floor_button_pressed", function (floorNum) {
        self.requestStopAtFloor(index, floorNum);
      });

      elevator.on("stopped_at_floor", function (floorNum) {
        self.stoppedAtFloor(index, floorNum);

        self.moveElevator(elevator, index);
      });

      elevator.on("idle", function () {
        self.moveElevator(elevator, index);
      });
    });
  }

  // pickups
  requestPickupFromFloor(floorNum: number) {
    this.pickupRequests.push(floorNum);
  }

  claimNextPickup(elevator: Elevator) {
    if (this.pickupRequests.length === 0) {
      return -1;
    }

    const floor = this.pickupRequests.shift();
    this.pickupRequests = this.pickupRequests.filter((x) => x !== floor);

    return floor;
  }

  // drop off requests
  requestStopAtFloor(elevatorIndex: number, floorNum: number) {
    this.stopRequests[elevatorIndex].push(floorNum);
  }

  determineNextDropoff(elevatorIndex: number) {
    const requests = this.stopRequests[elevatorIndex];

    if (requests.length === 0) {
      return -1;
    }

    return requests.shift();
  }

  // events
  stoppedAtFloor(elevatorIndex: number, floorNum: number) {
    this.pickupRequests = this.pickupRequests.filter((x) => x !== floorNum);
    this.stopRequests[elevatorIndex] = this.stopRequests[elevatorIndex].filter(
      (x) => x !== floorNum
    );
  }

  // commands
  moveElevator(elevator: Elevator, elevatorIndex: number) {
    const nextDropOff = this.determineNextDropoff(elevatorIndex);
    if (elevatorIndex >= 0) {
      elevator.goToFloor(nextDropOff);
      return;
    }

    const nextPickup = this.claimNextPickup(elevator);
    if (nextPickup >= 0) {
      elevator.goToFloor(nextPickup);
      return;
    }
  }
}
