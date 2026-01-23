export const environment = {
  production: true,
  apiBaseUrl: '',  // Uses same origin - CloudFront proxies /api/* to ALB
  skipAuth: false,  // Never skip auth in production
  cognitoLoginUrl:
    'https://veena-auth.auth.ap-south-1.amazoncognito.com/login' +
    '?client_id=d8jr78io0e1l7b7bu8eva7vqr' +
    '&response_type=token' +
    '&scope=openid+email+profile' +
    '&redirect_uri=https://d17362b1w27h09.cloudfront.net/admin/'
};
