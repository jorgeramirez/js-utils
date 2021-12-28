// @ts-ignore
window.paceOptions = {
  document: true, // disabled
  eventLag: {
    lagThreshold: 12
  },
  restartOnPushState: true,
  restartOnRequestAfter: false,
  ajax: {
    trackMethods: ['POST', 'GET', 'PUT', 'DELETE']
  }
};
