// @ts-ignore
window.paceOptions = {
  document: true, // disabled
  eventLag: {
    lagThreshold: 12
  },
  restartOnPushState: true,
  restartOnRequestAfter: 500,
  ajax: {
    trackMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS']
  }
};
