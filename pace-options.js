// @ts-ignore
window.paceOptions = {
  document: true, // disabled
  eventLag: {
    lagThreshold: 12
  },
  restartOnPushState: true,
  restartOnRequestAfter: 250,
  ajax: {
    trackMethods: ['POST', 'GET', 'PUT', 'DELETE']
  }
};
