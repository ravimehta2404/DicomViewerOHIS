/** @type {AppTypes.Config} */
window.config = {
  // Local dev: use root base so /viewer works
  routerBasename: '/dicom/',
  showStudyList: false,
  defaultDataSourceName: 'dicomweb',
  // Improves perceived speed by prefetching nearby series/images
  // some windows systems have issues with more than 3 web workers
  maxNumberOfWebWorkers: 3,
  // below flag is for performance reasons, but it might not work for all servers
  showWarningMessageForCrossOrigin: false,
  showCPUFallbackMessage: false,
  showLoadingIndicator: true,
  experimentalStudyBrowserSort: false,
  strictZSpacingForVolumeViewport: true,
  groupEnabledModesFirst: true,
  allowMultiSelectExport: false,
  maxNumRequests: {
    interaction: 100,
    thumbnail: 75,
    // Prefetch number is dependent on the http protocol. For http 2 or
    // above, the number of requests can be go a lot higher.
    prefetch: 25,
  },
  // Prefetch nearby series/images to improve perceived speed
  studyPrefetcher: {
    enabled: true,
    displaySetsCount: 4,
    maxNumPrefetchRequests: 25,
    order: 'closest',
  },

  // Load default & extra extensions for a fuller viewer experience
  extensions: [
    '@ohif/extension-default',
    '@ohif/extension-cornerstone',
    '@ohif/extension-cornerstone-dicom-seg',
    '@ohif/extension-cornerstone-dicom-sr',
    '@ohif/extension-cornerstone-dicom-rt',
    '@ohif/extension-cornerstone-dicom-pmap',
    '@ohif/extension-cornerstone-dynamic-volume',
    '@ohif/extension-dicom-pdf',
    '@ohif/extension-measurement-tracking',
    '@ohif/extension-tmtv',
    '@ohif/extension-dicom-video',
    '@ohif/extension-dicom-microscopy',
  ], // ← required
  // Use a real mode package so WorkList can call mode.isValidMode
  modes: ['@ohif/mode-basic-dev-mode'],

  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'Orthanc DICOMweb',
        name: 'Orthanc',
        wadoUriRoot: '/dicom-web',
        qidoRoot: '/dicom-web',
        wadoRoot: '/dicom-web',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        headers: {
          Authorization: 'Basic YWRtaW46T3J0aGFuY1dlYl9SQURfOTg3Iw==',
        },
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: true,
        staticWado: false,
        omitQuotationForMultipartRequest: true,
      },
    },
  ],
  httpErrorHandler: error => {
    const status =
      error && typeof error === 'object'
        ? (error['status'] ?? (error['response'] && error['response']['status']))
        : undefined;
    console.debug(status ?? error);
  },

  // Branding: replace OHIF logo with Radflare text logo and hide About menu
  whiteLabeling: {
    createLogoComponentFn: React =>
      React.createElement(
        'span',
        { className: 'text-white font-semibold tracking-wide text-lg' },
        ' RADFLARE '
      ),
    hideAbout: true,
  },
};
