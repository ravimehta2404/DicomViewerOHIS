import toolbarButtons from './toolbarButtons';
import { id } from './id';
import i18n from 'i18next';

// Note: keep runtime simple; remove unused configs to avoid linter noise

const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  measurements: '@ohif/extension-cornerstone.panelModule.panelMeasurement',
  thumbnailList: '@ohif/extension-default.panelModule.seriesList',
};

const cs3d = {
  viewport: '@ohif/extension-cornerstone.viewportModule.cornerstone',
};

const dicomsr = {
  sopClassHandler: '@ohif/extension-cornerstone-dicom-sr.sopClassHandlerModule.dicom-sr',
  viewport: '@ohif/extension-cornerstone-dicom-sr.viewportModule.dicom-sr',
};

const dicomvideo = {
  sopClassHandler: '@ohif/extension-dicom-video.sopClassHandlerModule.dicom-video',
  viewport: '@ohif/extension-dicom-video.viewportModule.dicom-video',
};

const dicompdf = {
  sopClassHandler: '@ohif/extension-dicom-pdf.sopClassHandlerModule.dicom-pdf',
  viewport: '@ohif/extension-dicom-pdf.viewportModule.dicom-pdf',
};

const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-sr': '^3.0.0',
  '@ohif/extension-dicom-pdf': '^3.0.1',
  '@ohif/extension-dicom-video': '^3.0.1',
};

function modeFactory({ modeConfiguration }) {
  return {
    id,
    routeName: 'dev',
    displayName: i18n.t('Modes:Basic Dev Viewer'),
    /**
     * Lifecycle hooks
     */
    onModeEnter: ({ servicesManager, extensionManager }: withAppTypes) => {
      const { toolbarService, toolGroupService } = servicesManager.services;
      const utilityModule = extensionManager.getModuleEntry(
        '@ohif/extension-cornerstone.utilityModule.tools'
      );

      const { toolNames, Enums } = (utilityModule as any).exports;

      const tools = {
        active: [
          {
            // toolName: toolNames.WindowLevel,
            // bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
            toolName: toolNames.StackScroll,
            bindings: [{ mouseButton: Enums.MouseBindings.Wheel }, { numTouchPoints: 3 }],
          },
          {
            toolName: toolNames.Pan,
            bindings: [{ mouseButton: Enums.MouseBindings.Auxiliary }],
          },
          {
            toolName: toolNames.Zoom,
            bindings: [{ mouseButton: Enums.MouseBindings.Secondary }, { numTouchPoints: 2 }],
          },
          {
            // toolName: toolNames.StackScroll,
            // bindings: [{ mouseButton: Enums.MouseBindings.Wheel }, { numTouchPoints: 3 }],
            toolName: toolNames.WindowLevel,
            bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
          },
        ],
        passive: [
          { toolName: toolNames.Length },
          { toolName: toolNames.Bidirectional },
          { toolName: toolNames.Probe },
          { toolName: toolNames.EllipticalROI },
          { toolName: toolNames.CircleROI },
          { toolName: toolNames.RectangleROI },
          { toolName: toolNames.StackScroll },
          { toolName: toolNames.CalibrationLine },
        ],
        // enabled
        enabled: [{ toolName: toolNames.ImageOverlayViewer }],
        // disabled
      };

      toolGroupService.createToolGroupAndAddTools('default', tools);

      toolbarService.register(toolbarButtons);

      // Primary toolbar ordering per requirements
      toolbarService.updateSection('primary', [
        // Measurement category: two visible + dropdown
        'Length',
        'Angle',
        'MeasurementTools',

        // Probe
        'Probe',

        // Stack Scroll default on (already active via bindings); include button as visible
        'StackScroll',

        // Zoom group (Zoom visible + Magnify in dropdown)
        'ZoomGroup',

        // Pan
        'Pan',

        // Image Slice Sync
        'ImageSliceSync',

        // Reference Lines
        'ReferenceLines',

        // Crosshairs
        'Crosshairs',

        // Change View (reset/rotate/flip in dropdown)
        'MoreTools',

        // Layout (we’ll keep layout visible; advanced presets can be added later)
        'Layout',

        // Window Level with Invert in dropdown
        'WindowLevelGroup',

        // 2D MPR orientation menu
        'orientationMenu',

        // 3D MPR with presets dropdown
        'MPRGroup',

        // Window Presets group
        'WindowPreset',
      ]);

      // Measurement dropdown content
      toolbarService.updateSection('MeasurementTools', [
        'CobbAngle',
        'Bidirectional',
        'ArrowAnnotate',
        'EllipticalROI',
        'RectangleROI',
        'CircleROI',
        'PlanarFreehandROI',
        'SplineROI',
        'LivewireContour',
      ]);

      // Zoom dropdown
      toolbarService.updateSection('ZoomGroup', ['Magnify']);

      // Change View dropdown
      toolbarService.updateSection('MoreTools', ['RotateRight', 'FlipHorizontal', 'Reset']);

      // Window level dropdown
      toolbarService.updateSection('WindowLevelGroup', ['WindowLevel', 'Invert']);

      // 3D/MPR dropdown
      toolbarService.updateSection('MPRGroup', ['MPR', 'AxialPrimary', 'Only3D']);

      // Window presets dropdown
      toolbarService.updateSection('WindowPreset', [
        'Soft tissue',
        'Lung',
        'Liver',
        'Bone',
        'Brain',
      ]);
    },
    onModeExit: ({ servicesManager }: withAppTypes) => {
      const { toolGroupService, uiDialogService, uiModalService } = servicesManager.services;
      uiDialogService.hideAll();
      uiModalService.hide();
      toolGroupService.destroy();
    },
    validationTags: {
      study: [],
      series: [],
    },
    isValidMode: ({ modalities }) => {
      const modalities_list = modalities.split('\\');

      // Slide Microscopy modality not supported by basic mode yet
      return {
        valid: !modalities_list.includes('SM'),
        description: 'The mode does not support the following modalities: SM',
      };
    },
    routes: [
      {
        path: 'viewer-cs3d',
        /*init: ({ servicesManager, extensionManager }) => {
          //defaultViewerRouteInit
        },*/
        layoutTemplate: ({ location, servicesManager }) => {
          return {
            id: ohif.layout,
            props: {
              // TODO: Should be optional, or required to pass empty array for slots?
              leftPanels: [ohif.thumbnailList],
              leftPanelResizable: true,
              rightPanels: [ohif.measurements],
              rightPanelResizable: true,
              viewports: [
                {
                  namespace: cs3d.viewport,
                  displaySetsToDisplay: [ohif.sopClassHandler],
                },
                {
                  namespace: dicompdf.viewport,
                  displaySetsToDisplay: [dicompdf.sopClassHandler],
                },
              ],
            },
          };
        },
      },
    ],
    extensions: extensionDependencies,
    hangingProtocol: 'default',
    sopClassHandlers: [
      dicomvideo.sopClassHandler,
      ohif.sopClassHandler,
      dicompdf.sopClassHandler,
      dicomsr.sopClassHandler,
    ],
  };
}

const mode = {
  id,
  modeFactory,
  extensionDependencies,
};

export default mode;
