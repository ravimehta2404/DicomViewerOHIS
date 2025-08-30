/** @type {AppTypes.Config} */
window.config = {
  // Local dev: use root base so /viewer works
  routerBasename: '/dicom/',
  showStudyList: false,
  defaultDataSourceName: 'dicomweb',
  // Improves perceived speed by prefetching nearby series/images
  // some windows systems have issues with more than 3 web workers
  maxNumberOfWebWorkers: 4,
  // below flag is for performance reasons, but it might not work for all servers
  showWarningMessageForCrossOrigin: false,
  showCPUFallbackMessage: false,
  showLoadingIndicator: true,
  experimentalStudyBrowserSort: true,
  strictZSpacingForVolumeViewport: true,
  groupEnabledModesFirst: true,
  allowMultiSelectExport: false,
  maxNumRequests: {
    // Prioritize interactive viewport requests
    interaction: 8,
    thumbnail: 4,
    // Keep prefetch low so it never starves interaction
    prefetch: 2,
  },
  // enableStudyLazyLoad: true,

  studyPrefetcher: {
    enabled: true,
    displaySetCount: 1,
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
    '@ohif/extension-dicom-video',
    '@ohif/extension-dicom-microscopy',
    '@ohif/extension-measurement-tracking',
    '@ohif/extension-tmtv',
    '@ohif/extension-ultrasound-pleura-bline',
  ], // ← required
  // Use a real mode package so WorkList can call mode.isValidMode
  modes: ['@ohif/mode-basic-dev-mode'],
  // Optional: increase in-memory cache if the workstation has RAM headroom
  cornerstone: {
    // useCPURendering: true, // fallback for 3D
    cacheSizeInBytes: 512 * 1024 * 1024, // 512 MB
  },
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'Orthanc DICOMweb',
        name: 'Orthanc',
        // Use relative paths with proxy
        wadoUriRoot: '/dicom-web',
        qidoRoot: '/dicom-web',
        wadoRoot: '/dicom-web',
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

(function hardenForWeakClients(cfg) {
  function supportsWebGL2() {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      return !!gl && gl.getParameter(gl.MAX_TEXTURE_SIZE) >= 4096;
    } catch {
      return false;
    }
  }

  const cores = navigator.hardwareConcurrency || 2;
  const WEAK = !supportsWebGL2() || cores < 4;

  // Your full set (unchanged) for capable devices
  const EXT_FULL = [
    '@ohif/extension-default',
    '@ohif/extension-cornerstone',
    '@ohif/extension-cornerstone-dicom-seg',
    '@ohif/extension-cornerstone-dicom-sr',
    '@ohif/extension-cornerstone-dicom-rt',
    '@ohif/extension-cornerstone-dicom-pmap',
    '@ohif/extension-cornerstone-dynamic-volume', // MPR/3D
    '@ohif/extension-dicom-pdf',
    '@ohif/extension-dicom-video',
    '@ohif/extension-dicom-microscopy',
    '@ohif/extension-measurement-tracking',
    '@ohif/extension-tmtv',
    '@ohif/extension-ultrasound-pleura-bline',
  ];

  // Lean set for weak devices (drop only the 3D/MPR extension)
  const EXT_LEAN = EXT_FULL.filter(x => x !== '@ohif/extension-cornerstone-dynamic-volume');

  // Apply
  cfg.extensions = WEAK ? EXT_LEAN : EXT_FULL;

  // Workers/cache tuned by device
  const workerTarget = Math.min(4, Math.max(2, cores - 1));
  cfg.maxNumberOfWebWorkers = workerTarget;
  cfg.cornerstone = cfg.cornerstone || {};

  // IMPORTANT: keep GPU for capable devices so MPR works; use CPU only on weak
  cfg.cornerstone.useCPURendering = WEAK;
  cfg.cornerstone.cacheSizeInBytes = WEAK ? 512 * 1024 * 1024 : 1024 * 1024 * 1024;

  // Gentle prefetch for weak clients
  if (WEAK) {
    cfg.maxNumRequests = { interaction: 6, thumbnail: 3, prefetch: 1 };
    cfg.studyPrefetcher = { enabled: true, displaySetCount: 1 };
  } else if (cfg.studyPrefetcher) {
    // Ensure singular key is correct
    cfg.studyPrefetcher.displaySetCount = 1;
  }
})(window.config);

// (function hardenForWeakClients(cfg) {
//   function supportsWebGL2() {
//     try {
//       const gl = document.createElement('canvas').getContext('webgl2');
//       return !!gl && gl.getParameter(gl.MAX_TEXTURE_SIZE) >= 4096;
//     } catch {
//       return false;
//     }
//   }

//   const cores = navigator.hardwareConcurrency || 2;
//   const WEAK = !supportsWebGL2() || cores < 4;

//   const EXT_LEAN = [
//     '@ohif/extension-default',
//     '@ohif/extension-cornerstone',
//     '@ohif/extension-dicom-pdf',
//     '@ohif/extension-cornerstone-dicom-sr',
//     '@ohif/extension-measurement-tracking',
//   ];

//   const EXT_FULL = [
//     '@ohif/extension-default',
//     '@ohif/extension-cornerstone',
//     '@ohif/extension-cornerstone-dicom-seg',
//     '@ohif/extension-cornerstone-dicom-sr',
//     '@ohif/extension-cornerstone-dicom-rt',
//     '@ohif/extension-cornerstone-dynamic-volume', // MPR/3D
//     '@ohif/extension-dicom-pdf',
//     '@ohif/extension-measurement-tracking',
//   ];

//   // Swap extension list based on capability
//   cfg.extensions = WEAK ? EXT_LEAN : EXT_FULL;

//   // Workers/cache tuned by device
//   cfg.maxNumberOfWebWorkers = Math.min(4, Math.max(2, cores - 1));
//   cfg.cornerstone = cfg.cornerstone || {};
//   cfg.cornerstone.useCPURendering = WEAK; // <-- GPU on strong, CPU fallback on weak
//   // cfg.cornerstone.cacheSizeInBytes = WEAK ? 512 * 1024 * 1024 : 1024 * 1024 * 1024;

//   // Light prefetch for weak clients
//   if (WEAK) {
//     cfg.maxNumRequests = { interaction: 6, thumbnail: 3, prefetch: 1 };
//     cfg.studyPrefetcher = { enabled: true, displaySetCount: 1 }; // <-- singular
//   } else {
//     // Ensure correct key on strong clients too (your base had the plural)
//     if (cfg.studyPrefetcher) {
//       cfg.studyPrefetcher.displaySetCount = 1;
//     }
//   }
// })(window.config);

// for later: bake in a tiny “server-side 3D” hook next (so weak clients can still do MPR via a backend reslice endpoint), say the word and I’ll sketch the minimal API + OHIF toolbar action to call it.
