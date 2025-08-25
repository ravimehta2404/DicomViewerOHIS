/** @type {AppTypes.Config} */
window.config = {
  routerBasename: '/',
  showStudyList: true,
  defaultDataSourceName: 'dicomweb',

  extensions: [], // ← required
  modes: [
    // ← required
    {
      id: 'viewer',
      displayName: 'Viewer',
      routeName: 'viewer',
      isDefault: true,
      showStudyList: true,
      sopClassHandlers: [],
      // extensions: [],
      extensions: [
        '@ohif/extension-default',
        '@ohif/extension-cornerstone',
        '@ohif/extension-cornerstone-dicom',
        '@ohif/extension-cornerstone-tools',
        '@ohif/extension-cornerstone-segmentation',
        '@ohif/extension-dicom-sr',
        '@ohif/extension-measurement-tracking',
        '@ohif/extension-dicom-pdf',
        '@ohif/extension-dicom-html',
        '@ohif/extension-dicom-tag-browser',
        '@ohif/extension-vtk',
      ],
      hotkeys: [],
    },
  ],

  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'Orthanc DICOMweb',
        name: 'Orthanc',
        wadoUriRoot: 'http://localhost:8042/dicom-web',
        qidoRoot: 'http://localhost:8042/dicom-web',
        wadoRoot: 'http://localhost:8042/dicom-web',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: true,
        staticWado: false,
        omitQuotationForMultipartRequest: true,
      },
    },
  ],
};
