import React from 'react';
import { LoadingIndicatorProgress as BaseLoadingIndicatorProgress } from '@ohif/ui-next';

const BottomLoadingIndicatorProgress = (props: any) => {
  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-primary/20 h-1">
        <div className="bg-primary h-1 w-1/3 animate-pulse" />
      </div>
      {/* Keep original indicator hidden for screen readers or fallback */}
      <div className="sr-only">
        <BaseLoadingIndicatorProgress {...props} />
      </div>
    </div>
  );
};

export default {
  'ui.loadingIndicatorProgress': BottomLoadingIndicatorProgress,
};
