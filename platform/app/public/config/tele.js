/**
 * Tele-radiology focused configuration
 * - Study list disabled (viewer-only via query params)
 * - Minimal 2D extensions for faster load
 * - DICOMweb points to a proxy path; configure at deploy time
 */
/** @type {AppTypes.Config} */
window.config = {
  routerBasename: '/ohif/',
  showStudyList: false,
  defaultDataSourceName: 'dicomweb',

  // Keep this empty; extensions are selected per-mode below
  extensions: [],

  modes: [
    {
      id: 'viewer',
      displayName: 'Viewer',
      routeName: 'viewer',
      isDefault: true,
      showStudyList: false,
      // Minimal 2D extensions; exclude VTK/volume for faster startup
      extensions: [
        '@ohif/extension-default',
        '@ohif/extension-cornerstone',
        '@ohif/extension-cornerstone-segmentation',
        '@ohif/extension-dicom-sr',
        '@ohif/extension-dicom-pdf',
        '@ohif/extension-measurement-tracking',
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
        // Prefer reverse proxy from the same origin hosting the viewer
        // For direct Orthanc, set these to http://<host>:8042/dicom-web
        qidoRoot: '/dicom-web',
        wadoRoot: '/dicom-web',
        wadoUriRoot: '/dicom-web',
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
