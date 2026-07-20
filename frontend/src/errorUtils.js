const ERROR_CONFIGS = {
  401: {
    title: 'Session Expired',
    message: 'Your session has expired. Please sign in again to continue.',
    action: 'Sign In',
    actionType: 'auth',
  },
  404: {
    title: 'Coming Soon',
    message: 'This feature is not available yet. We are working hard to bring it to you.',
    action: null,
    actionType: null,
  },
  429: {
    title: 'Slow Down',
    message: 'You are making requests too quickly. Please wait a moment and try again.',
    action: 'Retry',
    actionType: 'retry',
  },
  500: {
    title: 'Something Went Wrong',
    message: 'The server encountered an error. Please try again in a moment.',
    action: 'Retry',
    actionType: 'retry',
  },
  0: {
    title: 'No Connection',
    message: 'Unable to connect to the server. Please check your internet connection.',
    action: 'Retry',
    actionType: 'retry',
  },
}

export function getErrorConfig(status) {
  return ERROR_CONFIGS[status] || ERROR_CONFIGS[500]
}
