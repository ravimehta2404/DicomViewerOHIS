import type { Button } from '@ohif/core/types';
import { defaults } from '@ohif/core';

export const setToolActiveToolbar = {
  commandName: 'setToolActive',
  commandOptions: {
    toolGroupIds: ['default', 'mpr'],
  },
  context: 'CORNERSTONE',
};

const toolbarButtons: Button[] = [
  // sections
  {
    id: 'MeasurementTools',
    uiType: 'ohif.toolButtonList',
    props: {
      buttonSection: true,
    },
  },
  {
    id: 'ZoomGroup',
    uiType: 'ohif.toolButtonList',
    props: {
      buttonSection: true,
    },
  },
  {
    id: 'MoreTools',
    uiType: 'ohif.toolButtonList',
    props: {
      buttonSection: true,
    },
  },
  {
    id: 'WindowLevelGroup',
    uiType: 'ohif.toolButtonList',
    props: {
      buttonSection: true,
    },
  },
  {
    id: 'MPRGroup',
    uiType: 'ohif.toolButtonList',
    props: {
      buttonSection: true,
    },
  },
  {
    id: 'WindowPreset',
    uiType: 'ohif.toolButtonList',
    props: {
      buttonSection: true,
    },
  },

  // tool defs
  {
    id: 'Length',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-length',
      label: 'Length',
      tooltip: 'Length Tool',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'Length',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Angle',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-angle',
      label: 'Angle',
      tooltip: 'Angle',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'Angle',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Bidirectional',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-bidirectional',
      label: 'Bidirectional',
      tooltip: 'Bidirectional Tool',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'Bidirectional',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'ArrowAnnotate',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-annotate',
      label: 'Annotation',
      tooltip: 'Arrow Annotate',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'ArrowAnnotate',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'EllipticalROI',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-ellipse',
      label: 'Ellipse',
      tooltip: 'Ellipse ROI',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'EllipticalROI',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'RectangleROI',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-rectangle',
      label: 'Rectangle',
      tooltip: 'Rectangle ROI',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'RectangleROI',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'CircleROI',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-circle',
      label: 'Circle',
      tooltip: 'Circle Tool',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'CircleROI',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'PlanarFreehandROI',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'icon-tool-freehand-roi',
      label: 'Freehand ROI',
      tooltip: 'Freehand ROI',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'PlanarFreehandROI',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'SplineROI',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'icon-tool-spline-roi',
      label: 'Spline ROI',
      tooltip: 'Spline ROI',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'SplineROI',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'LivewireContour',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'icon-tool-livewire',
      label: 'Livewire tool',
      tooltip: 'Livewire tool',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'LivewireContour',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Zoom',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-zoom',
      label: 'Zoom',
      tooltip: 'Zoom',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'Zoom',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Magnify',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-magnify',
      label: 'Zoom-in',
      tooltip: 'Zoom-in',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'Magnify',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Pan',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-move',
      label: 'Pan',
      tooltip: 'Pan',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'Pan',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'ImageSliceSync',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'link',
      label: 'Image Slice Sync',
      tooltip: 'Image Slice Sync',
      commands: 'toggleImageSliceSync',
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'ReferenceLines',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-referenceLines',
      label: 'Reference Lines',
      tooltip: 'Reference Lines',
      commands: 'toggleReferenceLines',
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'Crosshairs',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-crosshairs',
      label: 'Crosshairs',
      tooltip: 'Crosshairs',
      commands: 'toggleCrosshairs',
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'Capture',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-capture',
      label: 'Capture',
      tooltip: 'Capture',
      commands: 'showDownloadViewportModal',
      evaluate: [
        'evaluate.action',
        {
          name: 'evaluate.viewport.supported',
          unsupportedViewportTypes: ['video', 'wholeSlide'],
        },
      ],
    },
  },
  {
    id: 'Layout',
    uiType: 'ohif.layoutSelector',
    props: {
      rows: 3,
      columns: 4,
      evaluate: 'evaluate.action',
      commands: 'setViewportGridLayout',
    },
  },

  // Orientation (2D MPR menu)
  {
    id: 'orientationMenu',
    uiType: 'ohif.orientationMenu',
    props: {
      icon: 'layout-two-by-two',
      label: 'Orientation',
      tooltip:
        'Change viewport orientation between axial, sagittal, coronal and acquisition planes',
      evaluate: {
        name: 'evaluate.orientationMenu',
        hideWhenDisabled: true,
      },
    },
  },

  {
    id: 'Reset',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-reset',
      label: 'Reset View',
      tooltip: 'Reset View',
      commands: 'resetViewport',
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'RotateRight',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-rotate-right',
      label: 'Rotate Right',
      tooltip: 'Rotate Right +90',
      commands: 'rotateViewportCW',
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'FlipHorizontal',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-flip-horizontal',
      label: 'Flip Horizontally',
      tooltip: 'Flip Horizontally',
      commands: 'flipViewportHorizontal',
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'StackScroll',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-stack-scroll',
      label: 'Stack Scroll',
      tooltip: 'Stack Scroll',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'StackScroll',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Invert',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-invert',
      label: 'Invert Colors',
      tooltip: 'Invert Colors',
      commands: 'invertViewport',
      evaluate: 'evaluate.action',
    },
  },
  // Window/Level main button
  {
    id: 'WindowLevel',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-window-level',
      label: 'Window Level',
      tooltip: 'Window Level',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'WindowLevel',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'CalibrationLine',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-calibration',
      label: 'Calibration Line',
      tooltip: 'Calibration Line',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'CalibrationLine',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },

  // 3D/MPR commands
  {
    id: 'MPR',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'icon-mpr',
      label: 'MPR',
      tooltip: 'MPR',
      commands: {
        commandName: 'toggleHangingProtocol',
        commandOptions: {
          protocolId: 'mpr',
        },
      },
      evaluate: 'evaluate.displaySetIsReconstructable',
    },
  },
  {
    id: 'AxialPrimary',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'layout-advanced-axial-primary',
      label: 'Axial Primary',
      tooltip: 'Axial Primary',
      commands: {
        commandName: 'toggleHangingProtocol',
        commandOptions: {
          protocolId: 'primaryAxial',
        },
      },
      evaluate: 'evaluate.displaySetIsReconstructable',
    },
  },
  {
    id: 'Only3D',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'layout-advanced-3d-main',
      label: '3D Only',
      tooltip: '3D Only',
      commands: {
        commandName: 'toggleHangingProtocol',
        commandOptions: {
          protocolId: 'main3D',
        },
      },
      evaluate: 'evaluate.displaySetIsReconstructable',
    },
  },

  // Probe
  {
    id: 'Probe',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-probe',
      label: 'Probe',
      tooltip: 'Probe',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'Probe',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },

  // Window presets
  {
    id: 'Soft tissue',
    uiType: 'ohif.toolButton',
    props: {
      title: 'Soft tissue',
      commands: [
        {
          commandName: 'setWindowLevel',
          commandOptions: { ...defaults.windowLevelPresets[1] },
          context: 'CORNERSTONE',
        },
      ],
    },
  },
  {
    id: 'Lung',
    uiType: 'ohif.toolButton',
    props: {
      title: 'Lung',
      commands: [
        {
          commandName: 'setWindowLevel',
          commandOptions: { ...defaults.windowLevelPresets[2] },
          context: 'CORNERSTONE',
        },
      ],
    },
  },
  {
    id: 'Liver',
    uiType: 'ohif.toolButton',
    props: {
      title: 'Liver',
      commands: [
        {
          commandName: 'setWindowLevel',
          commandOptions: { ...defaults.windowLevelPresets[3] },
          context: 'CORNERSTONE',
        },
      ],
    },
  },
  {
    id: 'Bone',
    uiType: 'ohif.toolButton',
    props: {
      title: 'Bone',
      commands: [
        {
          commandName: 'setWindowLevel',
          commandOptions: { ...defaults.windowLevelPresets[4] },
          context: 'CORNERSTONE',
        },
      ],
    },
  },
  {
    id: 'Brain',
    uiType: 'ohif.toolButton',
    props: {
      title: 'Brain',
      commands: [
        {
          commandName: 'setWindowLevel',
          commandOptions: { ...defaults.windowLevelPresets[5] },
          context: 'CORNERSTONE',
        },
      ],
    },
  },
];

export default toolbarButtons;
