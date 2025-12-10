'use client';

import EngineSetupWizard from './EngineSetupWizard';

export default function FirstLaunch({ onComplete }: { onComplete: () => void }) {
  return <EngineSetupWizard onComplete={onComplete} />;
}

