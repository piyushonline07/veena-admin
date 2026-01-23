export const environment = {
  production: true,
  apiBaseUrl: 'http://VeenaI-Veena-EU0UwN2HYjdA-581371566.ap-south-1.elb.amazonaws.com',
  skipAuth: false,  // Never skip auth in production
  cognitoLoginUrl:
    'https://veena-auth.auth.ap-south-1.amazoncognito.com/login' +
    '?client_id=d8jr78io0e1l7b7bu8eva7vqr' +
    '&response_type=token' +
    '&scope=openid+email+profile' +
    '&redirect_uri=http://VeenaI-Veena-EU0UwN2HYjdA-581371566.ap-south-1.elb.amazonaws.com'
};
