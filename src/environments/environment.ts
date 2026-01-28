// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080',
  skipAuth: true,  // Set to false to enable authentication in development
  enableNotifications: false,
  // CloudFront configuration for cache invalidation and media delivery
  cloudfront: {
    distributionId: 'E2Y0I9RRO4EI2G',
    domainName: 'd2rn4a6nwzw5ey.cloudfront.net',
    url: 'https://d2rn4a6nwzw5ey.cloudfront.net'
  },
  // S3 unified bucket
  s3: {
    unifiedBucket: 'veenainfrastack-unifiedmediabucket2c966cc9-6eile87tdmek'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.


