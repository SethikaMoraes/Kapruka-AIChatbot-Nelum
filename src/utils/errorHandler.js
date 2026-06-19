export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AgentTimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AgentTimeoutError';
  }
}

export class McpError extends Error {
  constructor(message) {
    super(message);
    this.name = 'McpError';
  }
}

export class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class CheckoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CheckoutError';
  }
}

export class TrackingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TrackingError';
  }
}

export function getUserFriendlyMessage(error) {
  const name = error.name || '';
  
  if (name === 'ValidationError' || error.message?.includes('Invalid parameter')) {
    return "Aiyo, the details look a little confusing 😅 Please double check recipient phone format (e.g. 077 123 4567) and city coverage so Nelum can send your surprise!";
  }
  
  if (name === 'AgentTimeoutError' || error.message?.includes('timeout exceeded')) {
    return "Aiyo 😅 I am taking a little longer than usual to choose your gifts today. Try searching for products directly on the right side showcase!";
  }
  
  if (name === 'McpError' || name === 'NetworkError' || error.message?.includes('network error') || error.message?.includes('Failed to fetch') || error.message?.includes('aborted')) {
    return "Aiyo, our connection to the Kapruka catalog is a bit shaky right now 🌸 But don't worry, I am using our local backup gift store to help you shop. Try selecting one of our bestseller cakes on the right!";
  }
  
  if (name === 'CheckoutError') {
    return "Aiyo 😅 We ran into a small problem locking your checkout transaction. Please double check that your cart has items, and try again! 🌸";
  }
  
  if (name === 'TrackingError') {
    return "Aiyo, tracking database is down. Could not verify your order reference right now. Please double check details or try again later!";
  }
  
  return "Aiyo 😅 I ran into a small hiccup while picking your gifts. Let's try that again! 🌸";
}

export const errorHandler = {
  ValidationError,
  AgentTimeoutError,
  McpError,
  NetworkError,
  CheckoutError,
  TrackingError,
  getUserFriendlyMessage
};

export default errorHandler;
